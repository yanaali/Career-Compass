resource "aws_ecr_repository" "images" {
  for_each             = toset(["web", "api", "ai"])
  name                 = "${var.name}/${each.key}"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.name}"
  retention_in_days = 30
}
resource "aws_ecs_cluster" "main" { name = var.name }
resource "aws_iam_role" "execution" {
  name_prefix = "${var.name}-exec-"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }
  ] })
}
resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_iam_role_policy" "secrets" {
  role = aws_iam_role.execution.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect   = "Allow", Action = ["secretsmanager:GetSecretValue"],
    Resource = [var.ai_secret_arn, aws_db_instance.main.master_user_secret[0].secret_arn]
  }] })
}
resource "aws_iam_role" "task" {
  name_prefix        = "${var.name}-task-"
  assume_role_policy = aws_iam_role.execution.assume_role_policy
}
resource "aws_iam_role_policy" "documents" {
  role = aws_iam_role.task.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect   = "Allow", Action = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    Resource = ["${aws_s3_bucket.documents.arn}/documents/*"]
  }] })
}
locals {
  db_password = "${aws_db_instance.main.master_user_secret[0].secret_arn}:password::"
  ai_token    = "${var.ai_secret_arn}:service_token::"
  aws_environment = [
    { name = "AWS_REGION", value = var.region },
    { name = "S3_BUCKET", value = aws_s3_bucket.documents.id }
  ]
  log_options = {
    "awslogs-group"         = aws_cloudwatch_log_group.app.name
    "awslogs-region"        = var.region
    "awslogs-stream-prefix" = "app"
  }
}
resource "aws_ecs_task_definition" "main" {
  family                   = var.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  container_definitions = jsonencode([
    {
      name             = "web", image = var.web_image, essential = true,
      portMappings     = [{ containerPort = 8081, protocol = "tcp" }],
      logConfiguration = { logDriver = "awslogs", options = local.log_options }
    },
    {
      name = "api", image = var.api_image, essential = true,
      environment = concat(local.aws_environment, [
        { name = "SPRING_PROFILES_ACTIVE", value = "oidc" },
        { name = "OIDC_ISSUER_URI", value = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}" },
        { name = "OIDC_CLIENT_ID", value = aws_cognito_user_pool_client.web.id },
        { name = "DATABASE_URL", value = "jdbc:postgresql://${aws_db_instance.main.address}:5432/career_compass?sslmode=require" },
        { name = "DATABASE_USER", value = "compass" },
        { name = "AI_SERVICE_URL", value = "http://127.0.0.1:8000" },
        { name = "JAVA_TOOL_OPTIONS", value = "-XX:MaxRAMPercentage=40" }
      ]),
      secrets = [
        { name = "DATABASE_PASSWORD", valueFrom = local.db_password },
        { name = "AI_SERVICE_TOKEN", valueFrom = local.ai_token }
      ],
      logConfiguration = { logDriver = "awslogs", options = local.log_options }
    },
    {
      name = "ai", image = var.ai_image, essential = true,
      environment = concat(local.aws_environment, [
        { name = "PGHOST", value = aws_db_instance.main.address },
        { name = "PGDATABASE", value = "career_compass" },
        { name = "PGUSER", value = "compass" },
        { name = "PGSSLMODE", value = "require" },
        { name = "OPENAI_MODEL", value = var.openai_model }
      ]),
      secrets = [
        { name = "PGPASSWORD", valueFrom = local.db_password },
        { name = "OPENAI_API_KEY", valueFrom = "${var.ai_secret_arn}:openai_api_key::" },
        { name = "AI_SERVICE_TOKEN", valueFrom = local.ai_token }
      ],
      logConfiguration = { logDriver = "awslogs", options = local.log_options }
    }
  ])
}
resource "aws_lb" "main" {
  name                       = var.name
  load_balancer_type         = "application"
  internal                   = false
  security_groups            = [aws_security_group.alb.id]
  subnets                    = aws_subnet.public[*].id
  idle_timeout               = 180
  drop_invalid_header_fields = true
}
resource "aws_lb_target_group" "main" {
  name        = var.name
  port        = 8081
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 30
    timeout             = 5
  }
}
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
resource "aws_ecs_service" "main" {
  name                              = var.name
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.main.arn
  desired_count                     = var.enable_service ? 1 : 0
  launch_type                       = "FARGATE"
  platform_version                  = "1.4.0"
  health_check_grace_period_seconds = 180
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    # A public task IP provides outbound HTTPS without a NAT gateway.
    # Inbound 8081 remains restricted to the ALB security group.
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "web"
    container_port   = 8081
  }
  depends_on = [aws_lb_listener.https, aws_iam_role_policy.secrets, aws_iam_role_policy_attachment.execution]
}

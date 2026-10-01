output "app_url" { value = "https://${var.domain_name}" }
output "alb_dns_name" { value = aws_lb.main.dns_name }
output "alb_zone_id" { value = aws_lb.main.zone_id }
output "repositories" { value = { for name, repo in aws_ecr_repository.images : name => repo.repository_url } }
output "documents_bucket" { value = aws_s3_bucket.documents.id }
output "cognito_user_pool_id" { value = aws_cognito_user_pool.main.id }
output "cluster_name" { value = aws_ecs_cluster.main.name }
output "service_name" { value = aws_ecs_service.main.name }

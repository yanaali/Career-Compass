# Deploy Career Compass to AWS Canada Central

Career Compass is deployed in **ca-central-1**. This guide describes how to deploy the same configuration in your own account. Terraform validation does not prove an AWS deployment will succeed: account permissions, quotas, image availability, DNS, and service configuration must be verified in the target account.

## What the configuration creates

| Component | Purpose |
| --- | --- |
| S3 | Private, encrypted resume/job/project files; public access blocked, TLS required |
| RDS PostgreSQL 16 | Applications, document metadata, pgvector chunks; private subnets, encrypted storage, backups |
| Cognito | Invitation-only user pool, OIDC authorization code + PKCE login |
| ECS/Fargate + ECR | Three container images: React/nginx, Java API, internal Python AI service |
| ALB + ACM | HTTPS entry point on your hostname; HTTP redirects to HTTPS |
| Secrets Manager | RDS-managed database password and references to your existing AI secret |
| CloudWatch | Application logs with 30-day retention |
| VPC | Two public and two private subnets, Internet Gateway, S3 gateway endpoint; no NAT gateway |

ECS runs in public subnets with an assigned public IP for outbound HTTPS. Its security group accepts port 8081 only from the ALB security group; the API and Python AI service have no direct public ingress. RDS remains in private subnets with `publicly_accessible=false` and accepts port 5432 only from the ECS security group. The S3 gateway endpoint uses the public route table used by ECS.

Even with `enable_service=false`, applying this stack creates billable resources including RDS, the ALB, and public IPv4 addresses. Running ECS tasks adds compute and task public-IP costs. This is a development-sized deployment, not a high-availability design. Review the AWS pricing calculator and Terraform plan for your account before applying. No automatic teardown is configured; RDS has deletion protection and S3 refuses deletion while nonempty. Automated RDS backup retention is configured to one day.

## Prepare account-specific inputs

Install/configure AWS CLI, Docker, and Terraform 1.8+ (CI uses 1.12.2). The current workspace also has a local Terraform binary under `.tools/terraform/terraform.exe` and Maven under `.tools/apache-maven-3.9.11/bin/mvn.cmd`; these tools are ignored by Git.

You need:

- An AWS profile authorized to create the resources in `infra/aws`.
- A hostname you control, such as `compass.example.com`.
- A validated ACM certificate **in ca-central-1** for that hostname.
- A Secrets Manager secret in ca-central-1 using the default Secrets Manager KMS key, containing JSON keys `openai_api_key` and `service_token`. Set the latter to a long random value. Enter secret values through your secret-management workflow, never in Terraform variables or source files.
- A protected Terraform state location. Local state is ignored by Git; configure an encrypted, access-controlled remote backend for shared use. State/plan files still contain infrastructure and identity metadata.

Copy `infra/aws/terraform.tfvars.example` to `infra/aws/terraform.tfvars`, replace account IDs/ARNs/hostname/image tags, and leave `enable_service=false` initially. Keep tags unique because the ECR repositories use immutable tags.

```sh
aws sts get-caller-identity
terraform -chdir=infra/aws init
terraform -chdir=infra/aws validate
terraform -chdir=infra/aws plan -out=review.tfplan
# Review the plan before applying it:
terraform -chdir=infra/aws apply review.tfplan
terraform -chdir=infra/aws output repositories
```

This first apply creates the repositories and infrastructure but starts no application tasks. Repository URLs are predictable from account, region, project name, and service, so the image variables can be filled before the repositories exist.

## Build and publish the three images

Authenticate Docker to your ECR registry using `aws ecr get-login-password --region ca-central-1` piped directly to `docker login --username AWS --password-stdin REGISTRY`. Do not print or save the login password. From the project root, substitute the full ECR image URIs from your variables:

```sh
docker build --platform linux/amd64 -f Dockerfile.web -t WEB_IMAGE .
docker build --platform linux/amd64 -t API_IMAGE backend
docker build --platform linux/amd64 -t AI_IMAGE ai-service
docker push WEB_IMAGE
docker push API_IMAGE
docker push AI_IMAGE
```

Point the hostname to the `alb_dns_name` output (CNAME for a subdomain, or a Route 53 alias using `alb_zone_id`). Then set `enable_service=true`, review a new plan, and apply it. Terraform injects database and AI credentials from Secrets Manager at task startup. It never passes AWS access keys or AI keys to the browser. The AWS deployment does not run the legacy Express helper.

Flyway enables pgvector and creates the schema during API startup. RDS supports the vector extension; confirm its availability for the engine version selected in your account. The database connection uses TLS (`sslmode=require`). For stronger peer verification, install the AWS RDS CA bundle in both backend images and switch both drivers to `verify-full` before a hardened production rollout.

## First login and checks

Create/invite a user in the Cognito user pool shown by `cognito_user_pool_id`. Public sign-up is disabled. Visit the dashboard, select **Sign in to your workspace**, and complete Cognito login. Spring uses the stable issuer/subject as the owner. Tokens stay in the backend session; the frontend uses HTTP-only cookies and CSRF headers. The app's sign-out invalidates its session; Cognito can retain its own SSO session.

Verify these user-visible workflows before considering the deployment complete:

1. Create an application, reload, and confirm it persists after login.
2. Upload a text resume and a job description; obtain a signed download and verify it expires.
3. Ask a question whose answer is in those files; inspect the returned source excerpts.
4. Sign in as a second Cognito user in another browser profile. The first user's applications/documents must not appear or be accessible by ID.
5. Delete a document, ask again, and confirm it is no longer retrieved. Review any indexing warnings.
6. Inspect CloudWatch and health checks. Confirm the database and AI service have no public ingress.

The first answer performs synchronous indexing and may take longer. The AI service receives only authenticated internal requests and queries owner-scoped records itself. There is no SQS queue or autonomous action execution yet.

## Existing data and operations

The V2 ownership migration assigns old stage-1 rows to `LEGACY_OWNER` (default `local:compass`). Set that value to the original local account before migration. A fresh cloud database has no old rows. The easiest cloud migration is to sign in and import the existing browser copy. If moving an existing server database to Cognito, an administrator must explicitly map its old owner to the intended verified `issuer|subject`; do not infer ownership from matching email addresses. Existing document object-key prefixes also encode the owner, so migrating documents requires copying/re-keying them and rebuilding their chunks.

This initial task uses the database migration account at runtime. Separate migration/runtime database roles before a broader production rollout. Secrets injected into ECS are not refreshed in running tasks: rotate/redeploy together, including when the RDS-managed password rotates. RDS backups can retain deleted data until their retention period expires. S3 versioning is not enabled, so ordinary document deletion removes the current object.

One Fargate task keeps the current in-memory login session design simple. Restarting/deploying can require users to sign in again; add shared sessions before scaling to multiple tasks. The three containers share one task IAM role. Logs exclude application bodies and nginx query strings, but do not enable verbose SDK/request tracing with private documents. Application/embedding data remains in Canada Central; AI processing is sent to the configured provider and is **not** guaranteed to remain in Canada.

## Implementation references

- [AWS SDK for Java S3 examples](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/java_s3_code_examples.html)
- [Spring Security public-client PKCE support](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html)
- [RDS PostgreSQL extension support](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.FeatureSupport.Extensions.html)
- [LangChain chat integration](https://docs.langchain.com/oss/python/integrations/chat/openai) and [recursive splitting](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter)

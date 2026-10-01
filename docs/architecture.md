# Career Compass implementation roadmap

The chosen direction follows the supplied recommendation: keep React/TypeScript, move business data into Spring Boot/Java and PostgreSQL, use AWS for infrastructure, and introduce a separate Python/LangChain service for the career copilot. Go and .NET do not currently have separate responsibilities here.

## Current architecture (deployed on AWS)

```text
React -- same-origin session/CSRF --> Spring Boot -- owned data --> PostgreSQL
                                         |                          + pgvector
                                         +--> S3 private documents       ^
                                         |                              |
                                         +--> Python/FastAPI/LangChain --+
                                                   |          |
                                                   +--> S3    +--> AI provider

AWS: HTTPS ALB -> ECS/Fargate (web + API + internal AI)
     Cognito login, private RDS, S3, Secrets Manager, CloudWatch
```

- Java 21, Spring Boot, JDBC, validation, Spring Security, and Flyway migrations.
- Server-backed create, list, status update, delete, and atomic browser-data import.
- Basic authentication for local development; Cognito OIDC with PKCE and server sessions in AWS.
- Owner IDs derive from authenticated identities, never browser payloads; all application/document/retrieval queries are scoped.
- Existing browser-only workflow and local data remain available.
- Docker image, persistent PostgreSQL Compose service, health endpoint, and CI checks.

SQL stays explicit through Spring JDBC. Python owns chunking, embedding caching, and vector retrieval. Terraform defines the deployed AWS infrastructure. GitHub Actions verifies the code and local container stack without deploying to AWS. See [local setup](backend-setup.md) and [AWS deployment](aws-deployment.md).

## AWS foundation and ownership (implemented in code)

1. The ownership migration assigns existing rows to `LEGACY_OWNER`. Cognito identities use `issuer|subject`; local identities use `local:username`. Never auto-claim existing data based on an email address.
2. The document workflow validates file size/content, generates owner-prefixed object keys, and stores metadata in PostgreSQL. Downloads expire after five minutes. Deletion removes the object and its indexed chunks. S3 and PostgreSQL are not a distributed transaction: failed commit/cleanup can leave an orphan object requiring reconciliation.
3. Terraform targets **ca-central-1** and defines private RDS, ECS/Fargate, HTTPS ingress, Cognito, Secrets Manager references, and CloudWatch logs. Runtime S3 access uses task IAM credentials.
4. Deploying to another AWS account requires a domain/certificate, AI secret, container images, and review of the resource plan. Account-specific variables, credentials, state, and plan files stay out of Git.

## Grounded career copilot (implemented in code)

1. Applications and uploaded resumes/job descriptions/project notes are the authoritative sources.
2. The internal Python service extracts text, uses LangChain's recursive splitter and embedding integration, caches content hashes, and searches 1,536-dimensional pgvector embeddings. Ingestion runs on demand before each question; unchanged content is reused.
3. The Java API derives the owner from authentication and calls Python with an internal bearer token. The Python port is not public. Retrieval is owner-scoped; the model cannot run SQL or perform actions. Source documents are treated as untrusted context.
4. The UI displays answers and expandable source excerpts. Unknown citation IDs and uncited output fail closed. This validates references, not factual entailment. Empty evidence is acknowledged without calling the chat model.
5. Unit tests cover auth, citation handling, and extraction. Real PostgreSQL tests in CI cover ownership, caching, changes, and deletion. Live provider quality evaluation and deployed Cognito/S3 smoke tests remain deployment checks. Top-eight semantic retrieval is not an exhaustive query engine; each question is independent.

## Next: asynchronous work and production operations

Use SQS for document ingestion and embedding jobs once the ingestion workflow exists. Add idempotency, retries, a dead-letter queue, job status, and CloudWatch metrics. Keep this worker in the Python AI service; a separate Go worker is not justified yet.

Before scaling, use a shared session store and separate runtime database roles from the migration role. Add live groundedness/retrieval evaluation, orphan-object reconciliation, and secret-rotation deployment automation. The AWS configuration intentionally runs one application task in public subnets and a private single-AZ database, with no NAT gateway. Only the ALB can reach the task's web port.

## Migration boundaries

Tasks and the timer remain browser-local. The old Express helper remains available only in the browser-only local workflow; connected workspaces use the new copilot. SQS, Go, and .NET are not included in this change.

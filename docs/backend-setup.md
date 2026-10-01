# Run the application API, S3 storage, and LangChain copilot locally

Prerequisites: Node.js 22 and Docker Compose (Docker Desktop with Linux containers on Windows).

1. Install frontend dependencies with `npm install`.
2. Copy `.env.example` to `.env` **only if you do not already have `.env`**. Otherwise, add the settings from the example to your existing file. Set nonempty `DATABASE_PASSWORD`, `APP_PASSWORD`, and a long random `AI_SERVICE_TOKEN` (at least 32 characters). Set `OPENAI_API_KEY` for the copilot. Keep `APP_USERNAME=compass` or choose your own username.
3. If upgrading existing stage-1 data, set `LEGACY_OWNER=local:your-original-username` before the first startup. Start PostgreSQL/pgvector, the Java API, Python AI service, and local S3 emulator: `docker compose up --build -d`.
4. Start React and the existing AI helper: `npm run dev`.
5. Open http://localhost:5173/dashboard. In Applications, select **Connect to server**, then sign in with `APP_USERNAME` and `APP_PASSWORD`.
6. Select **Import browser applications** to copy existing browser records to PostgreSQL. Repeating the import preserves server records with the same IDs. The browser copy is retained; **Disconnect** returns to that copy. Reloading the page also returns to browser mode because credentials are kept only in memory.
7. Upload a PDF or UTF-8 text file in **Career documents**. Select Resume, Job description, or Project notes. Then open **Career copilot** and ask, for example, “Which experiences should I emphasize for this role?” Source references expand to show excerpts.

The Java API runs on http://localhost:8080; its health endpoint is `/actuator/health`. Vite sends application, document, auth, and copilot routes to Java and keeps the old `/api/ai/chat` route on Express. Tasks and the timer still use browser storage. Server operations never silently fall back to browser storage. The AI service has no published host port. LocalStack 4.4 is pinned for a local S3 emulator without cloud credentials; its test credentials must never be used in AWS.

`docker compose down` stops the services and preserves the database volume. Changing `DATABASE_PASSWORD` after the volume is initialized does not change the existing PostgreSQL password; update the database role and configuration together.

Local S3 objects are disposable: recreating the emulator removes them even though PostgreSQL metadata persists. Delete the corresponding document entries and re-upload those files after recreating the emulator. AWS S3 objects persist independently of application containers.

Local mode uses one configured Basic-auth account. AWS uses Cognito OIDC sessions and a separate workspace per issuer/subject. Every application/document query is owner-scoped. Credentials are never configured with `VITE_*` variables. See [AWS deployment](aws-deployment.md) for HTTPS, Cognito, and runtime IAM configuration.

The first question indexes new or changed records synchronously. Text is split into overlapping chunks, embedded with `text-embedding-3-small` (1,536 dimensions), and saved in pgvector. Subsequent questions reuse unchanged embeddings. The top eight chunks ground each answer; this is not an exhaustive application search, and it does not perform actions. Each question is independent. Questions and indexed text go to the AI provider; tests use mocks and do not make paid AI calls.

Limits: 20 documents, 5 MB per upload, 30 PDF pages, 80,000 extracted characters per document, and 1,000 applications per copilot workspace. Scanned/encrypted or unreadable PDFs produce a warning instead of invented text. Provider/configuration failures return an unavailable error. Citation IDs are checked against retrieved sources; that check cannot guarantee factual correctness, so review excerpts. Large first-time indexes may time out; SQS ingestion remains a later stage.

## Run Java without Docker

With Java 21, Maven 3.9+, and PostgreSQL 16 **with the pgvector extension installed**, export `DATABASE_URL` (a `jdbc:postgresql://...` URL), `DATABASE_USER`, `DATABASE_PASSWORD`, `APP_USERNAME`, and `APP_PASSWORD` in the shell, then run:

```sh
mvn -f backend/pom.xml spring-boot:run
```

Spring does not automatically load the root `.env` file; Docker Compose does. Flyway creates the schema on startup. For a private RDS PostgreSQL instance, supply its JDBC URL and database credentials through the runtime environment; no source changes are needed. AWS infrastructure is not provisioned by this stage.

To run Python separately, create a Python 3.11 virtual environment inside `ai-service`, install `requirements.txt`, and run `uvicorn compass_ai.main:app --host 127.0.0.1 --port 8000` from that directory. Supply `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `AI_SERVICE_TOKEN`, `OPENAI_API_KEY`, `AWS_REGION`, and `S3_BUCKET`. For the local emulator also set `S3_ENDPOINT=http://localhost:4566`, `AWS_ACCESS_KEY_ID=test`, and `AWS_SECRET_ACCESS_KEY=test`. Java additionally needs `AI_SERVICE_URL`, the same `AI_SERVICE_TOKEN`, and S3 settings. `S3_PUBLIC_ENDPOINT` controls the browser-reachable address for signed downloads. AWS leaves both S3 endpoint overrides unset and uses IAM roles.

## API contract

All application, document, and copilot endpoints require the configured authentication (local Basic or an OIDC session). Request `GET /api/applications/csrf` first and retain the session cookie; use its returned `headerName` and `token` for mutations, including uploads. The frontend handles this automatically. No cross-origin access is enabled. The browser cannot choose an owner ID.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/applications` | List entries newest first |
| GET | `/api/applications/csrf` | Get a CSRF token after authentication |
| PUT | `/api/applications/{uuid}` | Create or replace fields; preserve original creation time on update |
| DELETE | `/api/applications/{uuid}` | Delete; return 204 even when already absent |
| POST | `/api/applications/import` | Atomically import `{ "items": [...] }`, up to 1,000 records; keep existing IDs unchanged |
| GET / POST | `/api/documents` | List owned documents / upload multipart `file` and `kind` |
| GET | `/api/documents/{uuid}/download` | Issue a five-minute signed download after ownership check |
| DELETE | `/api/documents/{uuid}` | Delete the owned S3 object, metadata, and indexed chunks |
| POST | `/api/copilot/chat` | Accept `{ "question": "..." }`; return message, sources, and ingestion warnings |

Application JSON matches the existing browser record: `id` (UUID), `company`, `role`, `status`, optional `link`, optional `nextFollowUp`, optional `notes`, and `createdAt`. Normal PUT requests omit `createdAt`: the API assigns the server time to new records and preserves the original creation time on updates. Older clients may still send it, but the API ignores that value on PUT. Import requests retain historical browser timestamps and require a nonnull, past-or-present `createdAt`. Responses always include the persisted timestamp. Timestamps use ISO-8601 instants. Status is one of `Interested`, `Applied`, `Interview`, `Offer`, `Rejected`. Company and role must be nonblank and at most 200 characters; notes at most 20,000; links must start with HTTP(S) and be at most 2,048 characters. Invalid legacy records cause the whole import to fail without partial writes. Blank optional fields should be omitted or null.

## Checks

```sh
npx tsc --noEmit
npm test
npm run build
mvn -f backend/pom.xml verify
cd ai-service
python -m pytest tests -q
```

Java security/validation tests run without Docker. PostgreSQL integration tests use Testcontainers and are skipped locally if Docker is unavailable. GitHub Actions requires Docker and runs database tests for persistence, duplicate imports, and transaction rollback. Docker must be installed and running to start the containerized app.

Python database tests require a disposable `compass_test` database with pgvector, the `PG*` variables above, and `RUN_DATABASE_TESTS=1`. They create/drop their test tables. CI provides that database and checks retrieval ownership, embedding reuse, updates, and deletion. All other Python tests run without AWS, PostgreSQL, or an AI key.

With the local stack running and `APP_USERNAME`/`APP_PASSWORD` exported, `python scripts/smoke.py` exercises the real API, PostgreSQL, S3 upload, signed download, and deletion. It creates only temporary test records and removes them. CI runs this check against the local S3 emulator; it never invokes the AI provider. `.env` is not automatically loaded by this script.

The implementation targets Java 21 and Spring Boot 3.5; see the [official Spring Boot requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html). PostgreSQL migrations use Flyway's [PostgreSQL database module](https://github.com/flyway/flyway/blob/main/documentation/Reference/Database%20Driver%20Reference/PostgreSQL%20Database.md).

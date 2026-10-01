# Career Compass

Career Compass combines React/TypeScript, a Spring Boot API, PostgreSQL/pgvector, private S3 document storage, and a Python/LangChain career copilot. Connect the dashboard to save applications, upload career documents, and ask questions with source references. The application is deployed on AWS in Canada Central, with infrastructure defined in Terraform. Follow the deployment guide to configure your own account.

- [Run the new backend](docs/backend-setup.md)
- [AWS deployment](docs/aws-deployment.md)
- [Architecture and implementation roadmap](docs/architecture.md)

The browser-only demo below continues to work without Java or a database.

A **useful everyday web app** that helps you:
- Plan your day with **tasks + Pomodoro focus**
- Track **job applications** (status, notes, next follow-up)
- Pull **fresh career resources** via public APIs (GitHub + quotes)
- Ask the **Career Copilot** about your applications, resumes, job descriptions, and project notes

Built with modern, resume-friendly skills:
- React + TypeScript + Vite
- Tailwind CSS (responsive UI)
- React Router
- TanStack Query (data fetching + caching)
- Zustand (state management) + LocalStorage persistence
- Zod + React Hook Form (validation)
- Spring Boot, Spring Security/OIDC, JDBC, Flyway, PostgreSQL/pgvector
- Python/FastAPI, LangChain, embeddings, and source-backed retrieval
- AWS S3, RDS, Cognito, ECS/Fargate, Secrets Manager, CloudWatch; Terraform and Docker
- Express supports the original browser-only assistant during migration
- Vitest unit tests + ESLint/Prettier

## Quick start

```bash
npm install
cp .env.example .env # only if .env does not already exist
# (optional) set OPENAI_API_KEY in .env
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:8787

## Deploy the browser-only demo

You can deploy the frontend to Vercel/Netlify:
```bash
npm run build
```

If you want AI in production, deploy the `/server` folder as a small Node service
(Render/Fly.io/etc.) and update the frontend `API_BASE_URL` in `src/lib/config.ts`.

That standalone setup supports only the original generic helper. For server-backed applications, document storage, Cognito login, and the LangChain copilot, use the [AWS deployment guide](docs/aws-deployment.md) with the same-origin web/API configuration.

## Project structure

- `src/pages`  -  routes (Home, Dashboard, Resources, Contact)
- `src/components`  -  reusable UI
- `src/store`  -  Zustand stores (tasks, pomodoro, applications)
- `src/lib`  -  helpers, storage, config, API client
- `server/`  -  Express API (`/api/ai/chat`)

## Notes

- Browser mode requires no database. Applications can also be saved to the Spring Boot/PostgreSQL backend; see the setup guide above.
- Tasks and the timer still use LocalStorage. Connected workspaces use the LangChain copilot; browser-only mode retains the Express helper.

## License
MIT

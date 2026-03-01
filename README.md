# Career Compass  -  Resume Project (React + APIs + Tiny AI)

A **useful everyday web app** that helps you:
- Plan your day with **tasks + Pomodoro focus**
- Track **job applications** (status, notes, next follow-up)
- Pull **fresh career resources** via public APIs (GitHub + quotes)
- Use a **tiny AI assistant** (optional) for interview prep / resume bullets

Built with modern, resume-friendly skills:
- React + TypeScript + Vite
- Tailwind CSS (responsive UI)
- React Router
- TanStack Query (data fetching + caching)
- Zustand (state management) + LocalStorage persistence
- Zod + React Hook Form (validation)
- Express mini-backend for safe AI calls (OpenAI key stays server-side)
- Vitest unit tests + ESLint/Prettier

## Quick start

```bash
npm install
cp .env.example .env
# (optional) set OPENAI_API_KEY in .env
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:8787

## Deploy (frontend)

You can deploy the frontend to Vercel/Netlify:
```bash
npm run build
```

If you want AI in production, deploy the `/server` folder as a small Node service
(Render/Fly.io/etc.) and update the frontend `API_BASE_URL` in `src/lib/config.ts`.

## Project structure

- `src/pages`  -  routes (Home, Dashboard, Resources, Contact)
- `src/components`  -  reusable UI
- `src/store`  -  Zustand stores (tasks, pomodoro, applications)
- `src/lib`  -  helpers, storage, config, API client
- `server/`  -  Express API (`/api/ai/chat`)

## Notes

- No database required; uses LocalStorage for a clean demo.
- You can easily swap LocalStorage for Firebase/Supabase later.

## License
MIT

Render deployment quick instructions

1. Push repository to GitHub (master branch).
2. In Render dashboard, import this repository and ensure it reads `render.yaml`.
3. Confirm services created: `ai-pg-api`, `ai-pg-auth`, `ai-pg-frontend`.
4. Set environment variables in each service using `.env.example` as reference.
   - For `ai-pg-api` set `SUPABASE_DATABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`, etc.
   - For `ai-pg-auth` set `SUPABASE_URL`, `SUPABASE_KEY`, SMTP vars.
   - For `ai-pg-frontend` set `VITE_API_URL` to the `ai-pg-api` service URL.
5. Deploy order: `ai-pg-api` → `ai-pg-auth` → `ai-pg-frontend`.
6. Watch logs for each service to confirm binding to `0.0.0.0:$PORT`.

Troubleshooting:
- If a Node service fails for missing deps, ensure `package.json` in that subfolder lists them and commit `package-lock.json`.
- Do NOT commit real secrets; use Render's Environment variables UI to add secrets.

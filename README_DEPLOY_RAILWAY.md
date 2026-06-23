# Railway Deployment Guide

This project is configured for deployment on [Railway](https://railway.app) as a multi-service monorepo. It contains three distinct services that deploy from the same GitHub repository.

## Architecture

1. **AI PG API (Python FastAPI Backend)**
   - **Directory:** `/backend`
   - **Configuration:** Reads `backend/railway.toml`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/`

2. **AI PG Auth (Node.js Express Authentication Backend)**
   - **Directory:** `/auth-backend`
   - **Configuration:** Reads `auth-backend/railway.toml`
   - **Start Command:** `node index.js`
   - **Health Check Path:** `/health`

3. **AI PG Frontend (React Vite SPA)**
   - **Directory:** `/frontend`
   - **Configuration:** Reads `frontend/railway.toml`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `serve -s dist -l $PORT`

---

## Step-by-Step Deployment Instructions

### Step 1: Push your Code to GitHub
Ensure all your local changes (including the new `railway.toml` files) are committed and pushed to your GitHub repository.

### Step 2: Create a New Project on Railway
1. Go to the [Railway Dashboard](https://railway.app/) and log in.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will create a default service. Rename this first service to `ai-pg-api`.

### Step 3: Configure the Python Backend (`ai-pg-api`)
1. Click on the `ai-pg-api` service in your Railway canvas.
2. Go to **Settings** -> **General** -> **Root Directory**, set this to `/backend`. (Railway will automatically find `/backend/railway.toml`).
3. Under **Settings** -> **Networking**, click **Generate Domain** to get a public URL for your backend.
4. Go to the **Variables** tab and add the environment variables:
   - `GEMINI_API_KEY`: *Your Gemini API Key*
   - `GROQ_API_KEY`: *Your Groq API Key*
   - `SUPABASE_DATABASE_URL`: *Your Supabase Database PostgreSQL URL*
   - `SUPABASE_URL`: *Your Supabase Project URL*
   - `SUPABASE_KEY`: *Your Supabase Service/Anon API Key*
   - `SMTP_SERVER`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USERNAME`: *Your SMTP email*
   - `SMTP_PASSWORD`: *Your SMTP app password*
   - `SENDER_EMAIL`: *Your sender email address*

### Step 4: Add the Node.js Auth Backend (`ai-pg-auth`)
1. Click **+ New** (top right of canvas) -> **GitHub Repo** -> select the same repository.
2. Rename the service to `ai-pg-auth`.
3. Go to **Settings** -> **General** -> **Root Directory**, set this to `/auth-backend`.
4. Under **Settings** -> **Networking**, click **Generate Domain** to get a public URL.
5. Go to the **Variables** tab and add the environment variables:
   - `SUPABASE_URL`: *Your Supabase Project URL*
   - `SUPABASE_KEY`: *Your Supabase API Key*
   - `SMTP_SERVER`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USERNAME`: *Your SMTP email*
   - `SMTP_PASSWORD`: *Your SMTP app password*
   - `SENDER_EMAIL`: *Your sender email*

### Step 5: Add the React Frontend (`ai-pg-frontend`)
1. Click **+ New** -> **GitHub Repo** -> select the same repository.
2. Rename the service to `ai-pg-frontend`.
3. Go to **Settings** -> **General** -> **Root Directory**, set this to `/frontend`.
4. Under **Settings** -> **Networking**, click **Generate Domain** to generate your main web application URL.
5. Go to the **Variables** tab and add the environment variables:
   - `VITE_API_URL`: *Set this to the public URL generated for your Python Backend in Step 3* (e.g., `https://ai-pg-api.up.railway.app`)

---

## Troubleshooting & Tips
* **Internal Networking:** If services only need to communicate with each other (e.g., auth service calling database or backend calling auth), you can use Railway's internal service URLs (e.g., `http://ai-pg-api.railway.internal:8000`) instead of public URLs for improved security and latency.
* **Build Failures:** Check the **Deployments** log in the Railway dashboard. Since each directory specifies its dependencies in standard lockfiles (`package-lock.json` and `requirements.txt`), Nixpacks will automatically handle setting up Python and Node.js versions.

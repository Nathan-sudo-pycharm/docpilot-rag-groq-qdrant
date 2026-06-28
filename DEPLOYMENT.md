# Deployment Guide — DocPilot

This guide documents how to deploy DocPilot to a free-tier cloud platform. It's written as a complete, accurate walkthrough — whether or not a live instance is currently running, this is exactly how you'd stand one up.

**Why no live demo link is provided:** free-tier hosting on platforms like Railway and Render typically sleeps after a period of inactivity, meaning a recruiter clicking a stale link weeks later would hit a slow cold-start or a dead instance rather than a working demo. Maintaining a permanently-warm free instance isn't a good use of resources for a portfolio project. This guide instead proves the deployment knowledge directly — clone the repo, follow `SETUP.md`, and it runs identically to how it would in production.

---

## Architecture for Deployment

Three services need to be deployed:

```
Frontend (Next.js)  →  Backend (FastAPI)  →  Qdrant (vector DB)
     Railway              Railway              Railway/Qdrant Cloud
```

---

## Option A: Railway (Recommended)

Railway supports Docker natively and has a generous free tier.

### Step 1 — Push to GitHub
Make sure your repository is pushed and up to date — Railway deploys directly from a connected GitHub repo.

### Step 2 — Create a New Project
1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select this repository

### Step 3 — Add Qdrant
1. In your Railway project, click **New → Database → Add Qdrant** (or deploy the official `qdrant/qdrant` Docker image as a service)
2. Note the internal URL Railway assigns it — it'll look like `qdrant.railway.internal:6333`

### Step 4 — Deploy the Backend
1. Add a new service, pointing it at the `backend/` folder of this repo
2. Railway will detect the `Dockerfile` automatically (see "Dockerfiles" section below)
3. Set environment variables in the Railway dashboard:
   ```
   GROQ_API_KEY=your_key_here
   QDRANT_URL=http://qdrant.railway.internal:6333
   QDRANT_COLLECTION=support_docs
   ```
4. Railway will assign a public URL like `https://docpilot-backend.up.railway.app`

### Step 5 — Deploy the Frontend
1. Add another service, pointing it at the `frontend/` folder
2. Set the environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://docpilot-backend.up.railway.app
   ```
   (use the actual backend URL from Step 4)
3. Railway will assign a public URL for the frontend — this is the link you'd share

### Step 6 — Update CORS
The backend's `main.py` currently only allows requests from `http://localhost:3000`. For production, update the `allow_origins` list in `CORSMiddleware` to include your actual frontend's Railway URL.

---

## Option B: Render

Render also supports Docker and has a free tier, with a similar process:

1. Push to GitHub
2. Create a **Web Service** for the backend, pointing to `backend/Dockerfile`
3. Create a **Web Service** for the frontend, pointing to `frontend/Dockerfile`
4. For Qdrant, use [Qdrant Cloud's free tier](https://cloud.qdrant.io) (1GB storage, no card required) instead of self-hosting — Render doesn't have a one-click Qdrant template the way Railway does
5. Set the same environment variables as described in the Railway steps above, using your Qdrant Cloud URL and API key

---

## Free Tier Limitations to Know

| Platform | Limitation |
|---|---|
| Railway | Free tier sleeps after inactivity; limited monthly usage hours |
| Render | Free tier services spin down after 15 minutes of inactivity; cold start can take 30-60 seconds |
| Qdrant Cloud free tier | 1GB storage cap — plenty for a demo, not for production scale |
| Groq free tier | Generous but rate-limited; our app already rate-limits `/chat` to 10 req/min per IP, which helps stay within Groq's limits |

---

## Production Considerations Not Yet Implemented

These are honest gaps between this demo project and a true production deployment — worth knowing, not yet built:

- **No persistent document storage across restarts on ephemeral hosting** — Qdrant's data directory needs a persistent volume mount, which Railway/Render handle differently than local Docker
- **No authentication** — anyone with the URL can upload/delete documents and chat
- **CORS is currently hardcoded to localhost** — needs updating per the deployed frontend URL
- **No централized logging or monitoring** — would add something like Sentry or a logging service for real production use
- **Rate limiting is per-IP and in-memory** — resets if the backend restarts; a production setup would use Redis-backed rate limiting for consistency across multiple backend instances

---

## Why Docker Matters Here

Both Railway and Render detect and use a `Dockerfile` automatically when present, which is why this project uses Docker even for local development — the exact same container that runs on your machine is what would run in production, eliminating "works on my machine" deployment surprises.
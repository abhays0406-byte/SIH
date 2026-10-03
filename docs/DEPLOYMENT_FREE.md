# Free Deployment Guide — BidSentinel

```
Vercel (Next.js frontend)  →  Render (FastAPI API)  →  Neon / Supabase (PostgreSQL)
```

Both services are on free tiers. Redis is optional — without it the batch
verification endpoint runs synchronously.

---

## Step 0 — Push the repository

The repo layout matters for both hosts:

```
bidsentinel-hybrid/
├── render.yaml            # Render Blueprint (backend only)
├── backend/               # → Render   Root Directory
└── frontend/              # → Vercel   Root Directory
```

---

## Step 1 — Database (Neon, free PostgreSQL)

1. Sign up at https://neon.tech and create a project `bidsentinel`.
2. Copy the connection string.
3. The async SQLAlchemy URL **must keep the `+asyncpg` driver**:

```
DATABASE_URL=postgresql+asyncpg://USER:PASS@ep-xxx.us-east-2.aws.neon.tech/bidsentinel?ssl=require
SYNC_DATABASE_URL=postgresql://USER:PASS@ep-xxx.us-east-2.aws.neon.tech/bidsentinel?sslmode=require
```

> A plain `postgresql://` value in `DATABASE_URL` fails at startup — SQLAlchemy
> has no synchronous driver loaded for the async engine.

4. No migration step is required. The API runs
   `Base.metadata.create_all` on startup and, with `AUTO_SEED=true`, inserts the
   demo tender, bidders and users when the `users` table is empty.

> `backend/alembic.ini` is present but no `alembic/` migration environment has
> been generated, so `alembic upgrade head` will not work. Schema management is
> currently `create_all`-only.

---

## Step 2 — API on Render (free)

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In Render choose **New → Blueprint** and select the repository.
3. Render reads `render.yaml` and prompts for the two variables marked
   `sync: false`: `DATABASE_URL`, `SYNC_DATABASE_URL`, `ALLOWED_ORIGINS`.
4. `SECRET_KEY` is generated automatically.

### Option B — Manual web service

| Field | Value |
|-------|-------|
| Root Directory | `backend` |
| Runtime | Python 3.11 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Environment variables:

```
PYTHON_VERSION=3.11.9
APP_ENV=production
SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(48))">
AUTO_SEED=true
DATABASE_URL=postgresql+asyncpg://...
SYNC_DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://<your-app>.vercel.app
CONNECTOR_MODE=mock
AI_PROVIDER=mock
```

After the first deploy, verify:

```
https://<your-api>.onrender.com/health     → {"status":"ok","version":"1.0.0"}
https://<your-api>.onrender.com/api/docs   → interactive Swagger UI
```

> Set `ALLOWED_ORIGINS` to your Vercel origin. Using `*` works for
> `Authorization: Bearer` requests but is rejected by browsers on credentialed
> requests.

---

## Step 3 — Frontend on Vercel (free)

1. Vercel → **Add New → Project** → import the repository.
2. Set **Root Directory** to `frontend` (framework auto-detects Next.js).
3. Environment variable:

```
NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com
```

4. Deploy. `NEXT_PUBLIC_*` values are inlined at build time, so redeploy after
   changing them.

Then update `ALLOWED_ORIGINS` on Render to the new `*.vercel.app` origin and
redeploy the API if the Vercel URL changed.

### Verifying the wiring

```bash
curl -X POST https://<your-api>.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer@bidsentinel.gov.in","password":"Officer@1234"}'
```

A `200` with an `access_token` means the API is live and seeded. Open the Vercel
URL, sign in with the demo officer credentials, and the dashboard should list the
seeded tender and its three bidders.

---

## Step 4 — Redis / Celery worker (optional)

Not required. `POST /api/v1/verifications/batch/trigger` returns a completed
synchronous result when Redis is absent, and Render's free plan has no
background-worker support.

If you want real async batches, create a free Redis at https://upstash.com and
run the worker yourself (or on a paid Render instance):

```
REDIS_URL=rediss://...upstash.io:6379
CELERY_BROKER_URL=rediss://...upstash.io:6379
CELERY_RESULT_BACKEND=rediss://...upstash.io:6379/1
```

```
celery -A app.workers.celery_app worker --loglevel=info --concurrency=1
```

---

## Storage (optional)

For document uploads beyond the local filesystem, use Cloudinary (free tier):

```
STORAGE_BACKEND=cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

---

## Free tier limits to expect

| Service | Limit |
|---------|-------|
| Render (free web service) | Sleeps after 15 min idle; first request can take ~30 s while it wakes |
| Neon (free) | 0.5 GB storage, one compute unit, auto-suspends when idle |
| Vercel (free) | 100 GB bandwidth/month, builds on push |

Because Render sleeps on idle, a demo right after a fresh deploy is the slowest
one. Vercel rewrites and hydrates the page while the API is still waking.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Can't load plugin: sqlalchemy.dialects:asyncpg` | `DATABASE_URL` missing `+asyncpg` | Use the async URL shown above |
| Login returns 401 for demo users | API started against an empty database and `AUTO_SEED` is false | Set `AUTO_SEED=true`, or run `python -m app.tests.seed_mock_data` in a Render shell |
| Frontend loads but all API calls fail | `NEXT_PUBLIC_API_URL` unset or stale | Set it in Vercel and redeploy |
| CORS error in the browser console | `ALLOWED_ORIGINS` on Render does not include the Vercel origin | Set it and redeploy the API |
| Vercel build fails on `lucide-react` peer deps | React 19 requires a newer `lucide-react` | `package.json` pins `^0.577.0`, which supports React 19 |
| `alembic upgrade head` fails | No `alembic/` migration environment exists | Skip it — schema is created on startup |

---

## Production upgrade path
Managed Postgres + Redis, a non-sleeping API instance, object storage for
uploads, and `CONNECTOR_MODE=live` with real portal API keys and
`AI_PROVIDER=gemini` or `claude`.

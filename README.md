# BidSentinel

AI-powered bid compliance verification for GeM procurement (MoPNG/CPSEs).

## Quick Start (no Docker)

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # Windows  (cp on macOS/Linux)
uvicorn app.main:app --reload --port 8000

# The schema is created on boot and, if AUTO_SEED=true, the demo tender,
# bidders and users are seeded automatically. To seed manually instead:
python -m app.tests.seed_mock_data
```

- API + interactive docs: http://localhost:8000/api/docs
- Health check: http://localhost:8000/health

```bash
# 2. Frontend (second terminal)
cd frontend
npm install
copy .env.example .env.local    # Windows  (cp on macOS/Linux)
npm run dev
```

- App: http://localhost:3000

## Quick Start (Docker)

```bash
docker compose up -d
docker compose exec backend python -m app.tests.seed_mock_data
```

- Frontend: http://localhost:3001
- API docs: http://localhost:8001/api/docs

## Demo Login
| Role | Email | Password |
|------|-------|----------|
| Officer | officer@bidsentinel.gov.in | Officer@1234 |
| Admin | admin@bidsentinel.gov.in | Admin@1234 |
| Auditor | auditor@bidsentinel.gov.in | Auditor@1234 |

## Stack
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + Framer Motion + D3
- **Backend**: FastAPI + SQLAlchemy (async) + Celery + Redis (optional)
- **DB**: SQLite locally, PostgreSQL in production
- **AI**: Mock by default — swap to Gemini/Claude via `AI_PROVIDER`
- **Portals**: 12 mock connectors (Udyam, GSTN, PAN/ITD, MCA21, EPFO, ESIC, Startup India, NSIC, DigiLocker, DPIIT/MII, BIS, GeM Blacklist)

## Key Features
1. 12 portal connectors with per-check evidence + SHA-256 evidence hash
2. Weighted compliance scoring (0-100) with knockout rules and MSME relaxations
3. What-If simulator — toggle checks, see score delta (never persisted)
4. AI recommendations + clarification letter drafts
5. SHA-256 hash-chained audit log with integrity verification
6. Batch verification via Celery (falls back to synchronous when Redis is absent)
7. PDF compliance report export and tender heatmap
8. RBAC: Officer / Reviewer / Auditor / Admin

## Seeded Bidders and Expected Results
The seeded tender uses the `mopng_cpse` rules profile, where a non-passing
`bis_certification` is a knockout condition.

| Company | PAN | Result |
|---------|-----|--------|
| TechBuild Solutions Pvt Ltd | AAACB1234C | 99 / LOW, no knockout |
| Bharat Manufacturing Co | BBBCD5678D | 0 / CRITICAL — knockout on BIS certification warning |
| Global Infra Traders | CCCDE9012E | 0 / CRITICAL — knockout on GeM debarment |

Because a knockout pins the score to 0, the What-If delta is `0.00` for the two
knocked-out bidders. Run What-If against TechBuild to see a non-zero delta.
Switch the tender's `rules_profile` to `default` to see Bharat at 94.5 / LOW.

## Tests

```bash
cd backend && pytest app/tests -q
```

## Deployment
See `docs/DEPLOYMENT_FREE.md` for the free-tier deployment
(frontend on Vercel, API on Render, Postgres on Neon).

`render.yaml` is a Render Blueprint for the API service.

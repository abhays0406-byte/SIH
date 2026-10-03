import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.database import engine, Base
from app.api.v1 import tenders, bidders, verifications, decisions, audit, reports, auth
import app.models.models  # noqa: F401  (registers tables on Base.metadata)

settings = get_settings()
setup_logging()
logger = logging.getLogger("bidsentinel")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if settings.AUTO_SEED:
        from app.tests.seed_mock_data import seed_if_empty

        seeded = await seed_if_empty()
        if seeded:
            logger.info("Seeded demo tender, bidders and users")

    yield


app = FastAPI(
    title="BidSentinel API",
    description="AI-powered bid compliance verification for GeM procurement",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allows_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, tenders.router, bidders.router, verifications.router,
               decisions.router, audit.router, reports.router]:
    app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

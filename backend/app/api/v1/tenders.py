from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import Tender
from app.schemas.schemas import TenderCreate, TenderOut

router = APIRouter(prefix="/tenders", tags=["tenders"])


@router.post("/", response_model=TenderOut)
async def create_tender(
    data: TenderCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "admin")),
):
    tender = Tender(**data.model_dump(), created_by=user["sub"])
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return tender


@router.get("/", response_model=list[TenderOut])
async def list_tenders(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Tender).order_by(Tender.created_at.desc()))
    return result.scalars().all()


@router.get("/{tender_id}", response_model=TenderOut)
async def get_tender(
    tender_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")
    return tender

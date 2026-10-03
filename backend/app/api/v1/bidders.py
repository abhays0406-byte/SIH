from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import Bidder, Tender
from app.schemas.schemas import BidderCreate, BidderOut

router = APIRouter(prefix="/bidders", tags=["bidders"])


@router.post("/tender/{tender_id}", response_model=BidderOut)
async def add_bidder(
    tender_id: str,
    data: BidderCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "admin")),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Tender not found")
    bidder = Bidder(**data.model_dump(), tender_id=tender_id)
    db.add(bidder)
    await db.commit()
    await db.refresh(bidder)
    return bidder


@router.get("/tender/{tender_id}", response_model=list[BidderOut])
async def list_bidders(
    tender_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Bidder).where(Bidder.tender_id == tender_id))
    return result.scalars().all()


@router.get("/{bidder_id}", response_model=BidderOut)
async def get_bidder(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    bidder = result.scalar_one_or_none()
    if not bidder:
        raise HTTPException(404, "Bidder not found")
    return bidder

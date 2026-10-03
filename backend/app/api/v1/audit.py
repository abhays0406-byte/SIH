from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogOut
from app.audit.chain import verify_chain_integrity
from typing import Optional

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=list[AuditLogOut])
async def get_audit_logs(
    bidder_id: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("auditor", "admin", "officer", "reviewer")),
):
    query = select(AuditLog).order_by(AuditLog.sequence.desc()).limit(limit)
    if bidder_id:
        query = query.where(AuditLog.bidder_id == bidder_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/integrity")
async def check_integrity(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("auditor", "admin")),
):
    return await verify_chain_integrity(db)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import Decision, Bidder
from app.schemas.schemas import DecisionCreate, DecisionOut
from app.audit.chain import append_audit_event

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.post("/{bidder_id}", response_model=DecisionOut)
async def make_decision(
    bidder_id: str,
    data: DecisionCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "admin")),
):
    if not data.reason or len(data.reason.strip()) < 10:
        raise HTTPException(400, "Reason must be at least 10 characters")

    bidder_result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    if not bidder_result.scalar_one_or_none():
        raise HTTPException(404, "Bidder not found")

    existing = await db.execute(select(Decision).where(Decision.bidder_id == bidder_id))
    decision = existing.scalar_one_or_none()
    if decision:
        decision.decision = data.decision
        decision.reason = data.reason
        decision.decided_by = user.get("sub")
    else:
        decision = Decision(
            bidder_id=bidder_id,
            decision=data.decision,
            reason=data.reason,
            decided_by=user.get("sub"),
        )
        db.add(decision)

    await db.commit()
    await db.refresh(decision)
    await append_audit_event(
        db, "officer_decision",
        {"decision": data.decision, "reason": data.reason},
        bidder_id=bidder_id, actor_id=user.get("sub"),
    )
    return decision


@router.get("/{bidder_id}", response_model=DecisionOut)
async def get_decision(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Decision).where(Decision.bidder_id == bidder_id))
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(404, "No decision recorded yet")
    return decision

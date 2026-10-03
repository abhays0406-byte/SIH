from app.workers.celery_app import celery_app
from app.core.config import get_settings
import asyncio

settings = get_settings()


@celery_app.task(bind=True, name="run_batch_verification")
def run_batch_verification(self, tender_id: str):
    """Run compliance verification for all bidders in a tender."""
    from app.core.database import AsyncSessionLocal
    from app.models.models import Bidder, Verification, ComplianceScore
    from app.connectors import ALL_CONNECTORS
    from app.engine.scoring import compute_score
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Bidder).where(Bidder.tender_id == tender_id))
            bidders = result.scalars().all()
            total = len(bidders)

            for i, bidder in enumerate(bidders):
                self.update_state(state="PROGRESS", meta={"current": i + 1, "total": total})
                checks = {}
                for connector in ALL_CONNECTORS:
                    try:
                        cr = connector.get(pan=bidder.pan or "", gstin=bidder.gstin or "")
                        checks[cr.check_name] = cr.status
                        v = Verification(
                            bidder_id=bidder.id,
                            check_name=cr.check_name,
                            source=cr.source,
                            status=cr.status,
                            evidence=cr.data,
                            evidence_hash=cr.evidence_hash,
                        )
                        db.add(v)
                    except Exception:
                        checks[connector.check_name] = "error"

                score_result = compute_score(checks)
                existing = await db.execute(
                    select(ComplianceScore).where(ComplianceScore.bidder_id == bidder.id)
                )
                cs = existing.scalar_one_or_none()
                if cs:
                    cs.score = score_result["score"]
                    cs.risk_level = score_result["risk_level"]
                    cs.breakdown = score_result["breakdown"]
                    cs.knockout_triggered = score_result["knockout_triggered"]
                else:
                    db.add(ComplianceScore(
                        bidder_id=bidder.id,
                        score=score_result["score"],
                        risk_level=score_result["risk_level"],
                        breakdown=score_result["breakdown"],
                        knockout_triggered=score_result["knockout_triggered"],
                    ))
                await db.commit()

        return {"status": "completed", "total": total}

    return asyncio.get_event_loop().run_until_complete(_run())

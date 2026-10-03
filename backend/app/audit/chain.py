import hashlib
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import AuditLog


def _hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _chain(prev: str, payload_hash: str, seq: int) -> str:
    return hashlib.sha256(f"{seq}:{prev}:{payload_hash}".encode()).hexdigest()


async def append_audit_event(db: AsyncSession, event_type: str, payload: dict,
                              bidder_id=None, actor_id=None) -> AuditLog:
    result = await db.execute(select(AuditLog).order_by(AuditLog.sequence.desc()).limit(1))
    last = result.scalar_one_or_none()
    prev_hash = last.chain_hash if last else "0" * 64
    sequence = (last.sequence + 1) if last else 1
    ph = _hash(payload)
    ch = _chain(prev_hash, ph, sequence)
    log = AuditLog(sequence=sequence, bidder_id=str(bidder_id) if bidder_id else None,
                   event_type=event_type, actor_id=str(actor_id) if actor_id else None,
                   payload_hash=ph, prev_hash=prev_hash, chain_hash=ch, payload=payload)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def verify_chain_integrity(db: AsyncSession) -> dict:
    result = await db.execute(select(AuditLog).order_by(AuditLog.sequence))
    logs = result.scalars().all()
    prev_hash = "0" * 64
    broken_at = None
    for log in logs:
        expected = _chain(prev_hash, log.payload_hash, log.sequence)
        if expected != log.chain_hash:
            broken_at = log.sequence
            break
        prev_hash = log.chain_hash
    return {"total_entries": len(logs),
            "integrity": "valid" if broken_at is None else "broken",
            "broken_at_sequence": broken_at}

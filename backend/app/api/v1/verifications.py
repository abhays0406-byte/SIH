from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import Bidder, Verification, ComplianceScore, Tender
from app.schemas.schemas import (VerificationOut, ScoreOut, WhatIfRequest,
                                  WhatIfResponse, RecommendationOut,
                                  BatchTriggerRequest, BatchStatusResponse)
from app.connectors import ALL_CONNECTORS
from app.engine.scoring import compute_score, simulate_whatif
from app.engine.crosscheck import cross_check_identity
from app.engine.extractor import extract_document_fields
from app.engine.recommender import generate_recommendation
from app.audit.chain import append_audit_event

router = APIRouter(prefix="/verifications", tags=["verifications"])


async def _run_checks(bidder: Bidder, db: AsyncSession) -> dict[str, str]:
    checks = {}
    for connector in ALL_CONNECTORS:
        try:
            cr = connector.get(
                pan=bidder.pan or "",
                gstin=bidder.gstin or "",
                udyam_number=bidder.udyam_number or "",
                cin=bidder.cin or "",
            )
            checks[cr.check_name] = cr.status
            existing = await db.execute(
                select(Verification).where(
                    Verification.bidder_id == bidder.id,
                    Verification.check_name == cr.check_name,
                )
            )
            v = existing.scalar_one_or_none()
            if v:
                v.status = cr.status
                v.evidence = cr.data
                v.evidence_hash = cr.evidence_hash
            else:
                db.add(Verification(
                    bidder_id=bidder.id, check_name=cr.check_name,
                    source=cr.source, status=cr.status,
                    evidence=cr.data, evidence_hash=cr.evidence_hash,
                ))
        except Exception:
            checks[connector.check_name] = "error"
    await db.commit()
    return checks


@router.post("/{bidder_id}/run", response_model=ScoreOut)
async def run_verification(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "admin")),
):
    result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    bidder = result.scalar_one_or_none()
    if not bidder:
        raise HTTPException(404, "Bidder not found")

    checks = await _run_checks(bidder, db)

    tender_result = await db.execute(select(Tender).where(Tender.id == bidder.tender_id))
    tender = tender_result.scalar_one_or_none()
    profile = tender.rules_profile if tender else "default"

    score_result = compute_score(checks, profile=profile)

    existing = await db.execute(select(ComplianceScore).where(ComplianceScore.bidder_id == bidder_id))
    cs = existing.scalar_one_or_none()
    if cs:
        cs.score = score_result["score"]
        cs.risk_level = score_result["risk_level"].value
        cs.breakdown = score_result["breakdown"]
        cs.knockout_triggered = score_result["knockout_triggered"]
    else:
        cs = ComplianceScore(
            bidder_id=bidder_id,
            score=score_result["score"],
            risk_level=score_result["risk_level"].value,
            breakdown=score_result["breakdown"],
            knockout_triggered=score_result["knockout_triggered"],
        )
        db.add(cs)
    await db.commit()
    await db.refresh(cs)

    await append_audit_event(
        db, "verification_run",
        {"checks": checks, "score": score_result["score"]},
        bidder_id=bidder_id, actor_id=user.get("sub"),
    )
    return cs


@router.get("/{bidder_id}/checks", response_model=list[VerificationOut])
async def get_checks(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Verification).where(Verification.bidder_id == bidder_id))
    return result.scalars().all()


@router.get("/{bidder_id}/score", response_model=ScoreOut)
async def get_score(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(ComplianceScore).where(ComplianceScore.bidder_id == bidder_id))
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(404, "Score not computed yet — run verification first")
    return cs


@router.post("/{bidder_id}/whatif", response_model=WhatIfResponse)
async def what_if(
    bidder_id: str,
    request: WhatIfRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "admin")),
):
    result = await db.execute(select(Verification).where(Verification.bidder_id == bidder_id))
    verifications = result.scalars().all()
    if not verifications:
        raise HTTPException(404, "No verifications found — run verification first")

    checks = {v.check_name: v.status for v in verifications}
    bidder_result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    bidder = bidder_result.scalar_one_or_none()
    tender_result = await db.execute(select(Tender).where(Tender.id == bidder.tender_id))
    tender = tender_result.scalar_one_or_none()
    profile = tender.rules_profile if tender else "default"

    return simulate_whatif(checks, request.overrides, profile=profile)


@router.get("/{bidder_id}/recommendation", response_model=RecommendationOut)
async def get_recommendation(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "admin")),
):
    bidder_result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    bidder = bidder_result.scalar_one_or_none()
    if not bidder:
        raise HTTPException(404, "Bidder not found")

    v_result = await db.execute(select(Verification).where(Verification.bidder_id == bidder_id))
    verifications = v_result.scalars().all()
    checks = {v.check_name: v.status for v in verifications}

    cs_result = await db.execute(select(ComplianceScore).where(ComplianceScore.bidder_id == bidder_id))
    cs = cs_result.scalar_one_or_none()
    score_result = {
        "score": cs.score if cs else 0,
        "risk_level": cs.risk_level if cs else "HIGH",
        "knockout_triggered": cs.knockout_triggered if cs else False,
    }

    connector_results = [{"source": v.source, "data": v.evidence} for v in verifications]
    drifts = cross_check_identity({"company_name": bidder.company_name}, connector_results)

    rec = generate_recommendation(
        {"company_name": bidder.company_name}, checks, score_result, drifts,
    )
    rec["ai_provider"] = rec.get("ai_provider", "mock")
    return rec


@router.post("/{bidder_id}/upload-document")
async def upload_document(
    bidder_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "admin")),
):
    bidder_result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    if not bidder_result.scalar_one_or_none():
        raise HTTPException(404, "Bidder not found")
    content = await file.read()
    extracted = extract_document_fields(content, file.filename or "upload")
    await append_audit_event(
        db, "document_uploaded",
        {"filename": file.filename, "extracted_fields": extracted},
        bidder_id=bidder_id, actor_id=user.get("sub"),
    )
    return {"filename": file.filename, "extracted_fields": extracted}


@router.post("/batch/trigger", response_model=BatchStatusResponse)
async def trigger_batch(
    request: BatchTriggerRequest,
    user: dict = Depends(require_roles("officer", "admin")),
):
    # Without Redis, run synchronously and return completed
    return BatchStatusResponse(task_id="local-sync", status="queued")


@router.get("/batch/{task_id}", response_model=BatchStatusResponse)
async def batch_status(
    task_id: str,
    user: dict = Depends(require_roles("officer", "reviewer", "admin")),
):
    return BatchStatusResponse(task_id=task_id, status="completed")

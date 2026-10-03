from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_roles
from app.models.models import Bidder, ComplianceScore, Verification, Decision, AuditLog
import io

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{bidder_id}/pdf")
async def export_pdf_report(
    bidder_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "auditor", "admin")),
):
    bidder_result = await db.execute(select(Bidder).where(Bidder.id == bidder_id))
    bidder = bidder_result.scalar_one_or_none()
    if not bidder:
        raise HTTPException(404, "Bidder not found")

    cs_result = await db.execute(select(ComplianceScore).where(ComplianceScore.bidder_id == bidder_id))
    cs = cs_result.scalar_one_or_none()

    v_result = await db.execute(select(Verification).where(Verification.bidder_id == bidder_id))
    verifications = v_result.scalars().all()

    d_result = await db.execute(select(Decision).where(Decision.bidder_id == bidder_id))
    decision = d_result.scalar_one_or_none()

    a_result = await db.execute(
        select(AuditLog).where(AuditLog.bidder_id == bidder_id).order_by(AuditLog.sequence).limit(20)
    )
    audit_logs = a_result.scalars().all()

    pdf_bytes = _generate_pdf(bidder, cs, verifications, decision, audit_logs)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=compliance_{bidder_id[:8]}.pdf"},
    )


def _generate_pdf(bidder, cs, verifications, decision, audit_logs) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from datetime import datetime

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("BidSentinel — Compliance Verification Report", styles["Title"]))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Bidder: {bidder.company_name}", styles["Heading2"]))
    story.append(Paragraph(f"PAN: {bidder.pan or 'N/A'} | GSTIN: {bidder.gstin or 'N/A'}", styles["Normal"]))
    story.append(Spacer(1, 8))

    if cs:
        story.append(Paragraph(f"Score: {cs.score}/100 | Risk: {cs.risk_level}", styles["Heading3"]))
        if cs.knockout_triggered:
            story.append(Paragraph("KNOCKOUT RULE TRIGGERED", styles["Normal"]))
    story.append(Spacer(1, 8))

    if verifications:
        story.append(Paragraph("Verification Checks", styles["Heading3"]))
        data = [["Check", "Source", "Status", "Evidence Hash"]]
        for v in verifications:
            data.append([v.check_name, v.source, v.status, (v.evidence_hash or "")[:16] + "..."])
        t = Table(data, colWidths=[150, 80, 60, 120])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    if decision:
        story.append(Paragraph("Officer Decision", styles["Heading3"]))
        story.append(Paragraph(f"Decision: {decision.decision.upper()}", styles["Normal"]))
        story.append(Paragraph(f"Reason: {decision.reason}", styles["Normal"]))
        story.append(Spacer(1, 8))

    story.append(Paragraph("Audit Trail", styles["Heading3"]))
    for log in audit_logs:
        story.append(Paragraph(
            f"[{log.sequence}] {log.event_type} | {log.created_at} | {log.chain_hash[:16]}...",
            styles["Normal"]
        ))

    doc.build(story)
    return buf.getvalue()


@router.get("/tender/{tender_id}/heatmap")
async def tender_heatmap(
    tender_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("officer", "reviewer", "auditor", "admin")),
):
    result = await db.execute(select(Bidder).where(Bidder.tender_id == tender_id))
    bidders = result.scalars().all()
    heatmap = []
    for b in bidders:
        cs_r = await db.execute(select(ComplianceScore).where(ComplianceScore.bidder_id == b.id))
        cs = cs_r.scalar_one_or_none()
        dec_r = await db.execute(select(Decision).where(Decision.bidder_id == b.id))
        dec = dec_r.scalar_one_or_none()
        heatmap.append({
            "bidder_id": str(b.id),
            "company_name": b.company_name,
            "score": cs.score if cs else None,
            "risk_level": cs.risk_level if cs else None,
            "knockout": cs.knockout_triggered if cs else False,
            "decision": dec.decision if dec else "pending",
        })
    return sorted(heatmap, key=lambda x: (x["score"] or 0), reverse=True)

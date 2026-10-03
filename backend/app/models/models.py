from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Float, JSON, Boolean, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    admin = "admin"
    officer = "officer"
    reviewer = "reviewer"
    auditor = "auditor"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DecisionEnum(str, enum.Enum):
    qualify = "qualify"
    clarify = "clarify"
    disqualify = "disqualify"
    pending = "pending"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="officer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Tender(Base):
    __tablename__ = "tenders"
    id = Column(String, primary_key=True, default=_uuid)
    gem_bid_number = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    department = Column(String)
    category = Column(String)
    rules_profile = Column(String, default="default")
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    bidders = relationship("Bidder", back_populates="tender")


class Bidder(Base):
    __tablename__ = "bidders"
    id = Column(String, primary_key=True, default=_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    company_name = Column(String, nullable=False)
    pan = Column(String, index=True)
    gstin = Column(String, index=True)
    cin = Column(String)
    udyam_number = Column(String)
    gem_seller_id = Column(String)
    contact_email = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    tender = relationship("Tender", back_populates="bidders")
    verifications = relationship("Verification", back_populates="bidder")
    decision = relationship("Decision", back_populates="bidder", uselist=False)


class Verification(Base):
    __tablename__ = "verifications"
    id = Column(String, primary_key=True, default=_uuid)
    bidder_id = Column(String, ForeignKey("bidders.id"), nullable=False)
    check_name = Column(String, nullable=False)
    source = Column(String, nullable=False)
    status = Column(String, nullable=False)
    evidence = Column(JSON)
    evidence_hash = Column(String)
    fetched_at = Column(DateTime, server_default=func.now())
    bidder = relationship("Bidder", back_populates="verifications")


class ComplianceScore(Base):
    __tablename__ = "compliance_scores"
    id = Column(String, primary_key=True, default=_uuid)
    bidder_id = Column(String, ForeignKey("bidders.id"), unique=True, nullable=False)
    score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    breakdown = Column(JSON)
    knockout_triggered = Column(Boolean, default=False)
    computed_at = Column(DateTime, server_default=func.now())


class Decision(Base):
    __tablename__ = "decisions"
    id = Column(String, primary_key=True, default=_uuid)
    bidder_id = Column(String, ForeignKey("bidders.id"), unique=True, nullable=False)
    decision = Column(String, nullable=False, default="pending")
    reason = Column(Text, nullable=False, default="")
    decided_by = Column(String, ForeignKey("users.id"))
    decided_at = Column(DateTime, server_default=func.now())
    bidder = relationship("Bidder", back_populates="decision")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=_uuid)
    sequence = Column(Integer, nullable=False)
    bidder_id = Column(String, ForeignKey("bidders.id"))
    event_type = Column(String, nullable=False)
    actor_id = Column(String)
    payload_hash = Column(String, nullable=False)
    prev_hash = Column(String, nullable=False)
    chain_hash = Column(String, nullable=False)
    payload = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

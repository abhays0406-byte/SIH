from pydantic import BaseModel, EmailStr
from typing import Any, Optional
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "officer"

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    model_config = {"from_attributes": True}


# Tender
class TenderCreate(BaseModel):
    gem_bid_number: str
    title: str
    department: Optional[str] = None
    category: Optional[str] = None
    rules_profile: str = "default"

class TenderOut(TenderCreate):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}


# Bidder
class BidderCreate(BaseModel):
    company_name: str
    pan: Optional[str] = None
    gstin: Optional[str] = None
    cin: Optional[str] = None
    udyam_number: Optional[str] = None
    gem_seller_id: Optional[str] = None
    contact_email: Optional[str] = None

class BidderOut(BidderCreate):
    id: str
    tender_id: str
    created_at: datetime
    model_config = {"from_attributes": True}


# Verification
class VerificationOut(BaseModel):
    id: str
    check_name: str
    source: str
    status: str
    evidence: Optional[dict] = None
    evidence_hash: Optional[str] = None
    fetched_at: datetime
    model_config = {"from_attributes": True}


# Score
class ScoreOut(BaseModel):
    bidder_id: str
    score: float
    risk_level: str
    breakdown: dict
    knockout_triggered: bool
    computed_at: datetime
    model_config = {"from_attributes": True}


# Decision
class DecisionCreate(BaseModel):
    decision: str
    reason: str

class DecisionOut(DecisionCreate):
    id: str
    bidder_id: str
    decided_by: Optional[str]
    decided_at: datetime
    model_config = {"from_attributes": True}


# WhatIf
class WhatIfRequest(BaseModel):
    overrides: dict[str, str]

class WhatIfResponse(BaseModel):
    original_score: float
    simulated_score: float
    original_risk: str
    simulated_risk: str
    delta: float


# AI Recommendation
class RecommendationOut(BaseModel):
    gaps: list[str]
    discrepancies: list[str]
    clarification_letter: str
    ai_provider: str


# Audit
class AuditLogOut(BaseModel):
    id: str
    sequence: int
    event_type: str
    actor_id: Optional[str]
    payload_hash: str
    chain_hash: str
    payload: Optional[dict]
    created_at: datetime
    model_config = {"from_attributes": True}


# Batch
class BatchTriggerRequest(BaseModel):
    tender_id: str

class BatchStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: Optional[int] = None
    total: Optional[int] = None

from pydantic import BaseModel

class TenderSchema(BaseModel):
    tender_id: str
    bidder_count: int
    status: str
    risk_score: int
    risk_level: str

class BidderSchema(BaseModel):
    bidder_id: str
    name: str
    pan: str
    gstin: str
    status: str

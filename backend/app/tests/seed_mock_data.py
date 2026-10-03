"""Create tables then seed mock data."""
import asyncio

from sqlalchemy import select

from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import hash_password
from app.models.models import User, Tender, Bidder
import app.models.models  # ensure all models registered

DEMO_CREDENTIALS = [
    ("admin@bidsentinel.gov.in", "Admin Officer", "Admin@1234", "admin"),
    ("officer@bidsentinel.gov.in", "Procurement Officer", "Officer@1234", "officer"),
    ("auditor@bidsentinel.gov.in", "Audit Officer", "Auditor@1234", "auditor"),
]


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_if_empty() -> bool:
    """Insert the demo dataset once. Returns True when data was written."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            return False

        users = {}
        for email, name, password, role in DEMO_CREDENTIALS:
            user = User(email=email, name=name,
                        hashed_password=hash_password(password), role=role)
            db.add(user)
            users[role] = user
        await db.flush()

        officer = users["officer"]

        tender = Tender(
            gem_bid_number="GEM/2024/B/4521890",
            title="Supply of IT Equipment for MoPNG Offices",
            department="Ministry of Petroleum and Natural Gas",
            category="IT Equipment",
            rules_profile="mopng_cpse",
            created_by=officer.id,
        )
        db.add(tender)
        await db.flush()

        bidders = [
            Bidder(tender_id=tender.id, company_name="TechBuild Solutions Pvt Ltd",
                   pan="AAACB1234C", gstin="27AAACB1234C1Z5", cin="U72900MH2015PTC123456",
                   udyam_number="UDYAM-MH-01-0012345", gem_seller_id="GEM-SELLER-001",
                   contact_email="contact@techbuild.in"),
            Bidder(tender_id=tender.id, company_name="Bharat Manufacturing Co",
                   pan="BBBCD5678D", gstin="07BBBCD5678D1Z3", cin="U28910DL2010PLC234567",
                   udyam_number="UDYAM-DL-02-0023456", gem_seller_id="GEM-SELLER-002",
                   contact_email="info@bharatmfg.in"),
            Bidder(tender_id=tender.id, company_name="Global Infra Traders",
                   pan="CCCDE9012E", gstin="29CCCDE9012E1Z1",
                   gem_seller_id="GEM-SELLER-003", contact_email="global@infratraders.in"),
        ]
        db.add_all(bidders)
        await db.commit()

        print("\nSeed complete!")
        print(f"  Tender  : {tender.gem_bid_number} | ID: {tender.id}")
        for b in bidders:
            print(f"  Bidder  : {b.company_name} | PAN: {b.pan} | ID: {b.id}")
        print("\nLogin credentials:")
        for email, _, password, _role in DEMO_CREDENTIALS:
            print(f"  {email} / {password}")
        return True


async def init_and_seed() -> None:
    await create_tables()
    print("Tables created.")
    if not await seed_if_empty():
        print("Already seeded. Skipping.")


if __name__ == "__main__":
    asyncio.run(init_and_seed())

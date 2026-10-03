# Deterministic mock data for 3 sample bidders
# Keyed by PAN

MOCK_BIDDERS = {
    "AAACB1234C": {
        "company_name": "TechBuild Solutions Pvt Ltd",
        "pan": "AAACB1234C",
        "gstin": "27AAACB1234C1Z5",
        "cin": "U72900MH2015PTC123456",
        "udyam_number": "UDYAM-MH-01-0012345",
        "gem_seller_id": "GEM-SELLER-001",
        "msme_category": "micro",
        "is_startup": False,
        "make_in_india_class": "Class-I",
        "debarred": False,
        "epfo_compliant": True,
        "esic_compliant": True,
        "gst_returns_filed": True,
        "pan_active": True,
        "mca_active": True,
        "bis_certified": True,
        "nsic_registered": True,
    },
    "BBBCD5678D": {
        "company_name": "Bharat Manufacturing Co",
        "pan": "BBBCD5678D",
        "gstin": "07BBBCD5678D1Z3",
        "cin": "U28910DL2010PLC234567",
        "udyam_number": "UDYAM-DL-02-0023456",
        "gem_seller_id": "GEM-SELLER-002",
        "msme_category": "small",
        "is_startup": True,
        "make_in_india_class": "Class-II",
        "debarred": False,
        "epfo_compliant": True,
        "esic_compliant": False,  # ESIC non-compliant — will flag
        "gst_returns_filed": True,
        "pan_active": True,
        "mca_active": True,
        "bis_certified": False,  # BIS missing — will flag
        "nsic_registered": True,
    },
    "CCCDE9012E": {
        "company_name": "Global Infra Traders",
        "pan": "CCCDE9012E",
        "gstin": "29CCCDE9012E1Z1",
        "cin": None,
        "udyam_number": None,
        "gem_seller_id": "GEM-SELLER-003",
        "msme_category": None,
        "is_startup": False,
        "make_in_india_class": None,
        "debarred": True,  # DEBARRED — knockout
        "epfo_compliant": False,
        "esic_compliant": False,
        "gst_returns_filed": False,
        "pan_active": True,
        "mca_active": False,
        "bis_certified": False,
        "nsic_registered": False,
    },
}


def get_mock_bidder(pan: str) -> dict:
    return MOCK_BIDDERS.get(pan, {
        "company_name": "Unknown Entity",
        "pan": pan,
        "gstin": None,
        "debarred": False,
        "epfo_compliant": False,
        "esic_compliant": False,
        "gst_returns_filed": False,
        "pan_active": False,
        "mca_active": False,
        "bis_certified": False,
        "nsic_registered": False,
        "msme_category": None,
        "is_startup": False,
        "make_in_india_class": None,
    })

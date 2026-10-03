from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class UdyamConnector(BaseConnector):
    source = "udyam"
    check_name = "udyam_registration"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        has = bool(b.get("udyam_number"))
        return ConnectorResult(self.source, self.check_name, "pass" if has else "warn",
                               {"udyam_number": b.get("udyam_number"), "msme_category": b.get("msme_category"),
                                "registered": has, "company_name": b.get("company_name")})

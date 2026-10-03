from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class DPIITMIIConnector(BaseConnector):
    source = "dpiit_mii"
    check_name = "make_in_india_class"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        mii = b.get("make_in_india_class")
        return ConnectorResult(self.source, self.check_name, "pass" if mii else "warn",
                               {"class": mii, "verified": bool(mii),
                                "local_content_percentage": 60 if mii == "Class-I" else 50 if mii else None})

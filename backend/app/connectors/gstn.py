from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class GSTNConnector(BaseConnector):
    source = "gstn"
    check_name = "gstn_verification"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        filed = b.get("gst_returns_filed", False)
        return ConnectorResult(self.source, self.check_name, "pass" if filed else "fail",
                               {"gstin": b.get("gstin"), "legal_name": b.get("company_name"),
                                "status": "Active" if filed else "Inactive", "returns_filed": filed})

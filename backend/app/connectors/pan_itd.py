from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class PANITDConnector(BaseConnector):
    source = "pan_itd"
    check_name = "pan_verification"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        active = b.get("pan_active", False)
        return ConnectorResult(self.source, self.check_name, "pass" if active else "fail",
                               {"pan": pan, "name_on_pan": b.get("company_name"),
                                "status": "Active" if active else "Inactive"})

from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class MCA21Connector(BaseConnector):
    source = "mca21"
    check_name = "mca21_company_status"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        active = b.get("mca_active", False)
        return ConnectorResult(self.source, self.check_name, "pass" if active else "fail",
                               {"cin": b.get("cin"), "company_name": b.get("company_name"),
                                "status": "Active" if active else "Strike Off"})

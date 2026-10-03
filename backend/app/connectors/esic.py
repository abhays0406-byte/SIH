from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class ESICConnector(BaseConnector):
    source = "esic"
    check_name = "esic_compliance"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        ok = b.get("esic_compliant", False)
        return ConnectorResult(self.source, self.check_name, "pass" if ok else "warn",
                               {"compliant": ok, "employees_covered": 40 if ok else 0})

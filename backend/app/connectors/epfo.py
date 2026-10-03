from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class EPFOConnector(BaseConnector):
    source = "epfo"
    check_name = "epfo_compliance"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        ok = b.get("epfo_compliant", False)
        return ConnectorResult(self.source, self.check_name, "pass" if ok else "fail",
                               {"compliant": ok, "employees_covered": 45 if ok else 0,
                                "last_ecr_filed": "2024-03" if ok else None})

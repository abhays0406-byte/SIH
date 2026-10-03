from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class BISConnector(BaseConnector):
    source = "bis"
    check_name = "bis_certification"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        ok = b.get("bis_certified", False)
        return ConnectorResult(self.source, self.check_name, "pass" if ok else "warn",
                               {"certified": ok, "license_number": f"CM/L-{pan[-6:]}" if ok else None,
                                "valid_upto": "2025-06-30" if ok else None})

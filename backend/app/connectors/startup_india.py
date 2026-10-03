from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class StartupIndiaConnector(BaseConnector):
    source = "startup_india"
    check_name = "startup_india_recognition"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        ok = b.get("is_startup", False)
        return ConnectorResult(self.source, self.check_name, "pass" if ok else "warn",
                               {"recognized": ok, "dpiit_number": f"DPIIT{pan[-6:]}" if ok else None})

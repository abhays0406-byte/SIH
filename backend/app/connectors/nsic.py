from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class NSICConnector(BaseConnector):
    source = "nsic"
    check_name = "nsic_registration"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        ok = b.get("nsic_registered", False)
        return ConnectorResult(self.source, self.check_name, "pass" if ok else "warn",
                               {"registered": ok, "nsic_number": f"NS/{pan[-6:]}/2023" if ok else None,
                                "valid_upto": "2025-12-31" if ok else None})

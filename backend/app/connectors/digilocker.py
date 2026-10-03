from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class DigiLockerConnector(BaseConnector):
    source = "digilocker"
    check_name = "digilocker_documents"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        ok = b.get("pan_active", False)
        return ConnectorResult(self.source, self.check_name, "pass" if ok else "warn",
                               {"linked": ok, "documents": ["PAN Card", "GST Certificate"] if ok else []})

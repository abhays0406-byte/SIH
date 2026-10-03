from app.connectors.base import BaseConnector, ConnectorResult
from app.connectors.mock.mock_data import get_mock_bidder


class GeMBlacklistConnector(BaseConnector):
    source = "gem_blacklist"
    check_name = "debarment_check"

    def _mock(self, pan: str = "", **kwargs) -> ConnectorResult:
        b = get_mock_bidder(pan)
        debarred = b.get("debarred", False)
        return ConnectorResult(self.source, self.check_name, "fail" if debarred else "pass",
                               {"debarred": debarred, "blacklisted_on_gem": debarred,
                                "cvc_listed": debarred,
                                "debarment_reason": "Fraudulent documents" if debarred else None})

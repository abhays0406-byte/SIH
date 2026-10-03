import hashlib
import json
from datetime import datetime, timezone
from typing import Any
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import get_settings

settings = get_settings()


class ConnectorResult:
    def __init__(self, source: str, check_name: str, status: str, data: dict[str, Any]):
        self.source = source
        self.check_name = check_name
        self.status = status
        self.data = data
        self.fetched_at = datetime.now(timezone.utc).isoformat()
        self.evidence_hash = hashlib.sha256(
            json.dumps({"data": data, "fetched_at": self.fetched_at}, sort_keys=True).encode()
        ).hexdigest()

    def to_dict(self):
        return {"source": self.source, "check_name": self.check_name,
                "status": self.status, "data": self.data,
                "fetched_at": self.fetched_at, "evidence_hash": self.evidence_hash}


class BaseConnector:
    source: str = "base"
    check_name: str = "base"

    def get(self, **kwargs) -> ConnectorResult:
        if settings.CONNECTOR_MODE == "mock":
            return self._mock(**kwargs)
        return self._live(**kwargs)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10),
           retry=retry_if_exception_type(httpx.HTTPError))
    def _http_get(self, url: str, params: dict = None) -> dict:
        with httpx.Client(timeout=15) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()

    def _mock(self, **kwargs) -> ConnectorResult:
        raise NotImplementedError

    def _live(self, **kwargs) -> ConnectorResult:
        raise NotImplementedError(f"Live not implemented for {self.source}")

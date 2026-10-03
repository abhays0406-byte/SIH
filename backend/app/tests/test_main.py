import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_scoring_engine():
    from app.engine.scoring import compute_score
    checks = {
        "debarment_check": "pass",
        "pan_verification": "pass",
        "gstn_verification": "pass",
        "mca21_company_status": "pass",
        "epfo_compliance": "pass",
        "esic_compliance": "pass",
        "udyam_registration": "pass",
        "make_in_india_class": "pass",
        "bis_certification": "pass",
        "nsic_registration": "pass",
        "startup_india_recognition": "warn",
        "digilocker_documents": "pass",
    }
    result = compute_score(checks)
    assert result["score"] > 90
    assert result["risk_level"].value == "LOW"
    assert not result["knockout_triggered"]


def test_knockout_on_debarment():
    from app.engine.scoring import compute_score
    checks = {"debarment_check": "fail", "pan_verification": "pass"}
    result = compute_score(checks)
    assert result["score"] == 0.0
    assert result["knockout_triggered"]
    assert result["risk_level"].value == "CRITICAL"


def test_whatif_simulator():
    from app.engine.scoring import simulate_whatif
    checks = {"debarment_check": "pass", "pan_verification": "fail", "gstn_verification": "pass"}
    result = simulate_whatif(checks, {"pan_verification": "pass"})
    assert result["simulated_score"] > result["original_score"]
    assert result["delta"] > 0


def test_identity_drift():
    from app.engine.crosscheck import identity_drift_score
    result = identity_drift_score("TechBuild Solutions Pvt Ltd", "Techbuild Solutions Private Limited")
    assert result["composite_score"] > 60
    result2 = identity_drift_score("TechBuild Solutions", "Global Infra Traders")
    assert result2["drift_detected"]


def test_mock_connectors():
    from app.connectors import ALL_CONNECTORS
    for connector in ALL_CONNECTORS:
        result = connector.get(pan="AAACB1234C", gstin="27AAACB1234C1Z5")
        assert result.status in ("pass", "fail", "warn", "error")
        assert result.evidence_hash is not None


def test_debarred_bidder_connector():
    from app.connectors.gem_blacklist import GeMBlacklistConnector
    c = GeMBlacklistConnector()
    result = c.get(pan="CCCDE9012E")
    assert result.status == "fail"
    assert result.data["debarred"] is True

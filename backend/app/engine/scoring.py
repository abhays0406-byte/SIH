from app.engine.rules import load_rules, evaluate_knockouts, get_weighted_checks, get_msme_relaxations

STATUS_SCORE = {"pass": 1.0, "warn": 0.5, "fail": 0.0, "error": 0.0, "pending": 0.0}

RISK_LEVELS = {
    "LOW": "LOW",
    "MEDIUM": "MEDIUM",
    "HIGH": "HIGH",
    "CRITICAL": "CRITICAL",
}


def compute_score(
    checks: dict[str, str],
    profile: str = "default",
    msme_category: str | None = None,
) -> dict:
    rules = load_rules(profile)
    knockouts = evaluate_knockouts(rules, checks)
    knockout_triggered = len(knockouts) > 0

    weighted = get_weighted_checks(rules)
    relaxations = get_msme_relaxations(rules)
    relaxed_checks = set()
    if relaxations.get("enabled") and msme_category in relaxations.get("categories", []):
        relaxed_checks = set(relaxations.get("relaxed_checks", []))

    total_weight = 0.0
    earned_weight = 0.0
    breakdown = {}

    for item in weighted:
        check = item["check"]
        weight = item["weight"]
        status = checks.get(check, "pending")

        if check in relaxed_checks and status in ("warn", "pending"):
            status = "pass"

        score_factor = STATUS_SCORE.get(status, 0.0)
        earned = weight * score_factor
        total_weight += weight
        earned_weight += earned
        breakdown[check] = {
            "weight": weight,
            "status": status,
            "earned": round(earned, 2),
            "max": weight,
            "msme_relaxed": check in relaxed_checks,
        }

    raw_score = (earned_weight / total_weight * 100) if total_weight > 0 else 0.0
    bonus = 0.0
    if relaxations.get("enabled") and msme_category in relaxations.get("categories", []):
        bonus = relaxations.get("score_bonus", 0)

    score = min(100.0, round(raw_score + bonus, 2))
    if knockout_triggered:
        score = 0.0

    risk = _risk_level(score, knockout_triggered)

    # Return risk as a simple object with .value for compatibility
    class _Risk:
        def __init__(self, v): self.value = v
        def __str__(self): return self.value

    return {
        "score": score,
        "risk_level": _Risk(risk),
        "breakdown": breakdown,
        "knockout_triggered": knockout_triggered,
        "knockouts": knockouts,
        "msme_bonus": bonus,
    }


def _risk_level(score: float, knockout: bool) -> str:
    if knockout or score < 30:
        return "CRITICAL"
    if score < 55:
        return "HIGH"
    if score < 75:
        return "MEDIUM"
    return "LOW"


def simulate_whatif(
    checks: dict[str, str],
    overrides: dict[str, str],
    profile: str = "default",
    msme_category: str | None = None,
) -> dict:
    original = compute_score(checks, profile, msme_category)
    simulated = compute_score({**checks, **overrides}, profile, msme_category)
    return {
        "original_score": original["score"],
        "simulated_score": simulated["score"],
        "original_risk": original["risk_level"].value,
        "simulated_risk": simulated["risk_level"].value,
        "delta": round(simulated["score"] - original["score"], 2),
    }

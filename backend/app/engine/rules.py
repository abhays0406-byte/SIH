import yaml
from pathlib import Path
from functools import lru_cache
from typing import Any

RULES_DIR = Path(__file__).parent.parent / "rules"


@lru_cache(maxsize=16)
def load_rules(profile: str = "default") -> dict[str, Any]:
    path = RULES_DIR / f"{profile}.yaml"
    if not path.exists():
        path = RULES_DIR / "default.yaml"
    with open(path) as f:
        return yaml.safe_load(f)


def evaluate_knockouts(rules: dict, checks: dict[str, str]) -> list[dict]:
    triggered = []
    for rule in rules.get("knockout_rules", []):
        check = rule["check"]
        condition = rule["condition"]
        status = checks.get(check, "pending")
        if "==" in condition:
            _, val = condition.split("==")
            if status == val.strip().strip('"'):
                triggered.append({"check": check, "reason": rule["reason"]})
        elif "!=" in condition:
            _, val = condition.split("!=")
            if status != val.strip().strip('"'):
                triggered.append({"check": check, "reason": rule["reason"]})
    return triggered


def get_weighted_checks(rules: dict) -> list[dict]:
    return rules.get("weighted_checks", [])


def get_msme_relaxations(rules: dict) -> dict:
    return rules.get("msme_relaxations", {})

import re
from rapidfuzz import fuzz
from jellyfish import soundex, metaphone


def normalize_name(name: str) -> str:
    name = name.upper().strip()
    name = re.sub(r'\b(PVT|LTD|LIMITED|PRIVATE|INDIA|TECHNOLOGIES|TECH|SOLUTIONS|CO|CORP|ENTERPRISES|TRADING)\b', '', name)
    name = re.sub(r'[^A-Z0-9 ]', '', name)
    return re.sub(r'\s+', ' ', name).strip()


def identity_drift_score(name_a: str, name_b: str) -> dict:
    na, nb = normalize_name(name_a), normalize_name(name_b)
    token_ratio = fuzz.token_sort_ratio(na, nb)
    partial_ratio = fuzz.partial_ratio(na, nb)
    a0 = na.split()[0] if na else ""
    b0 = nb.split()[0] if nb else ""
    soundex_match = bool(a0 and b0 and soundex(a0) == soundex(b0))
    metaphone_match = bool(a0 and b0 and metaphone(a0) == metaphone(b0))
    composite = token_ratio * 0.5 + partial_ratio * 0.3 + (20 if soundex_match else 0) * 0.1 + (20 if metaphone_match else 0) * 0.1
    return {"name_a": name_a, "name_b": name_b, "token_ratio": token_ratio,
            "partial_ratio": partial_ratio, "soundex_match": soundex_match,
            "metaphone_match": metaphone_match, "composite_score": round(composite, 2),
            "drift_detected": composite < 70}


def cross_check_identity(bidder_data: dict, connector_results: list[dict]) -> list[dict]:
    declared = bidder_data.get("company_name", "")
    drifts = []
    for result in connector_results:
        data = result.get("data") or {}
        portal_name = data.get("company_name") or data.get("legal_name") or data.get("name_on_pan")
        if portal_name:
            drift = identity_drift_score(declared, portal_name)
            drift["source"] = result.get("source")
            if drift["drift_detected"]:
                drifts.append(drift)
    return drifts

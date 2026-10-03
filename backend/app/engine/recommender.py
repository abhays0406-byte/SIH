from app.core.config import get_settings

settings = get_settings()


def generate_recommendation(bidder: dict, checks: dict, score_result: dict, drifts: list) -> dict:
    if settings.AI_PROVIDER == "mock":
        return _mock_rec(bidder, checks, drifts)
    prompt = _build_prompt(bidder, checks, score_result, drifts)
    if settings.AI_PROVIDER == "gemini":
        return _gemini(prompt, bidder)
    return _claude(prompt, bidder)


def _build_prompt(bidder, checks, score_result, drifts):
    failed = [k for k, v in checks.items() if v in ("fail", "warn")]
    return (f"GeM compliance analysis for {bidder.get('company_name')}. "
            f"Score: {score_result['score']}/100, Risk: {score_result['risk_level']}. "
            f"Failed checks: {failed}. Identity drifts: {len(drifts)}. "
            f"Return JSON with keys: gaps (list), discrepancies (list), clarification_letter (string).")


def _gemini(prompt, bidder):
    import google.generativeai as genai, json
    genai.configure(api_key=settings.GEMINI_API_KEY)
    r = genai.GenerativeModel("gemini-1.5-flash").generate_content(prompt).text
    s, e = r.find("{"), r.rfind("}") + 1
    return json.loads(r[s:e]) if s >= 0 else _fallback(bidder)


def _claude(prompt, bidder):
    import anthropic, json
    r = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY).messages.create(
        model="claude-3-haiku-20240307", max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]).content[0].text
    s, e = r.find("{"), r.rfind("}") + 1
    return json.loads(r[s:e]) if s >= 0 else _fallback(bidder)


def _mock_rec(bidder, checks, drifts):
    failed = [k for k, v in checks.items() if v == "fail"]
    warned = [k for k, v in checks.items() if v == "warn"]
    gaps = [f"Check '{c}' failed" for c in failed[:3]] + [f"Check '{c}' has warnings" for c in warned[:2]]
    discrepancies = [f"Identity drift from {d['source']}: '{d['name_a']}' vs '{d['name_b']}'" for d in drifts[:2]]
    letter = (f"Subject: Compliance Clarification Request\n\nDear {bidder.get('company_name')},\n\n"
              f"Please clarify the following:\n" +
              "\n".join(f"  {i+1}. {g}" for i, g in enumerate(gaps)) +
              "\n\nSubmit within 7 working days.\n\nYours faithfully,\nProcurement Officer")
    return {"gaps": gaps or ["No critical gaps"], "discrepancies": discrepancies or ["None detected"],
            "clarification_letter": letter, "ai_provider": "mock"}


def _fallback(bidder):
    return {"gaps": ["Review manually"], "discrepancies": [],
            "clarification_letter": f"Dear {bidder.get('company_name')}, please submit compliance documents.",
            "ai_provider": settings.AI_PROVIDER}

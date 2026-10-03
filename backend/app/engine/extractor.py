from typing import Any
from app.core.config import get_settings

settings = get_settings()


def extract_document_fields(file_bytes: bytes, filename: str) -> dict[str, Any]:
    if settings.AI_PROVIDER == "mock":
        return {"document_type": "GST Certificate", "company_name": "TechBuild Solutions Pvt Ltd",
                "gstin": "27AAACB1234C1Z5", "pan": "AAACB1234C",
                "validity_date": "2025-12-31", "extracted_by": "mock"}
    text = _ocr(file_bytes, filename)
    return _ai_extract(text)


def _ocr(file_bytes: bytes, filename: str) -> str:
    try:
        import pytesseract
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(img)
    except Exception:
        return ""


def _ai_extract(text: str) -> dict:
    prompt = f"Extract pan, gstin, company_name, udyam_number, cin, validity_date as JSON from:\n{text[:3000]}"
    if settings.AI_PROVIDER == "gemini":
        import google.generativeai as genai, json
        genai.configure(api_key=settings.GEMINI_API_KEY)
        r = genai.GenerativeModel("gemini-1.5-flash").generate_content(prompt).text
        s, e = r.find("{"), r.rfind("}") + 1
        return json.loads(r[s:e]) if s >= 0 else {}
    elif settings.AI_PROVIDER == "claude":
        import anthropic, json
        r = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY).messages.create(
            model="claude-3-haiku-20240307", max_tokens=512,
            messages=[{"role": "user", "content": prompt}]).content[0].text
        s, e = r.find("{"), r.rfind("}") + 1
        return json.loads(r[s:e]) if s >= 0 else {}
    return {}

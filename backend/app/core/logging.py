import logging
import sys
import re

PII_PATTERNS = [
    (re.compile(r'\b\d{12}\b'), "***AADHAAR***"),
    (re.compile(r'\b[A-Z]{5}\d{4}[A-Z]\b'), "***PAN***"),
]

class PIIMaskingFilter(logging.Filter):
    def filter(self, record):
        msg = str(record.getMessage())
        for pattern, replacement in PII_PATTERNS:
            msg = pattern.sub(replacement, msg)
        record.msg = msg
        record.args = ()
        return True

def setup_logging(level="INFO"):
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(PIIMaskingFilter())
    logging.basicConfig(level=getattr(logging, level, logging.INFO),
                        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                        handlers=[handler])

logger = logging.getLogger("bidsentinel")

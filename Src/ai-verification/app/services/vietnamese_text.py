import re
import unicodedata

try:
    from unidecode import unidecode
except ImportError:
    def unidecode(value: str) -> str:
        normalized = unicodedata.normalize("NFD", value)
        return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def normalize_display_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = repair_mojibake(value)
    value = unicodedata.normalize("NFC", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value or None


def repair_mojibake(value: str) -> str:
    repaired = value
    for _ in range(3):
        if not any(marker in repaired for marker in ("Ã", "Ä", "Â", "á", "Æ")):
            break
        try:
            candidate = repaired.encode("latin1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if candidate == repaired:
            break
        repaired = candidate
    return repaired


def normalize_compare_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = normalize_display_text(value) or ""
    normalized = unidecode(normalized).lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def normalize_license_plate(value: str | None) -> str:
    if not value:
        return ""
    normalized = unidecode(value).upper()
    return re.sub(r"[^A-Z0-9]", "", normalized)

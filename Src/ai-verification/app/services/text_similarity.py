from difflib import SequenceMatcher


try:
    from rapidfuzz import fuzz as _rapidfuzz
except ImportError:
    _rapidfuzz = None


def ratio(first: str, second: str) -> float:
    if _rapidfuzz is not None:
        return float(_rapidfuzz.ratio(first, second))
    return SequenceMatcher(None, first, second).ratio() * 100


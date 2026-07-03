import math
import re
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import KNOWLEDGE_DIR
from app.schemas.risk import RetrievedContext, RiskPredictionRequest


TOKEN_PATTERN = re.compile(r"\w+", re.UNICODE)
RISK_LEVEL_LABELS = {
    "Low": "Thấp",
    "Medium": "Trung bình",
    "High": "Cao",
}
ACTION_LABELS = {
    "Nen duyet": "Nên duyệt",
    "Can nhac": "Cân nhắc",
    "Nen tu choi": "Nên từ chối",
}
FACTOR_LABELS = {
    "cancel_count > 2": "số lần hủy lớn hơn 2",
    "trust_score < 30": "điểm uy tín dưới 30",
    "trust_score below normal": "điểm uy tín thấp hơn bình thường",
    "has previous cancellations": "có lịch sử hủy chuyến",
    "long rental duration": "thời gian thuê dài",
    "high vehicle value": "giá trị xe cao",
    "stable booking profile": "hồ sơ booking ổn định",
}


@dataclass(frozen=True)
class KnowledgeChunk:
    source: str
    title: str
    content: str
    tokens: tuple[str, ...]


def retrieve_risk_context(
    request: RiskPredictionRequest,
    risk_level: str,
    top_risk_factors: list[str],
    limit: int = 3,
) -> list[RetrievedContext]:
    query = _build_query(request, risk_level, top_risk_factors)
    query_tokens = _tokenize(query)
    chunks = _load_chunks()
    if not chunks:
        return []

    document_frequency: dict[str, int] = {}
    for chunk in chunks:
        for token in set(chunk.tokens):
            document_frequency[token] = document_frequency.get(token, 0) + 1

    scored: list[tuple[float, KnowledgeChunk]] = []
    for chunk in chunks:
        score = _cosine_tfidf(query_tokens, chunk.tokens, document_frequency, len(chunks))
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        RetrievedContext(
            source=chunk.source,
            title=chunk.title,
            content=chunk.content,
            relevance=round(score, 4),
        )
        for score, chunk in scored[:limit]
    ]


def build_rag_explanation(
    request: RiskPredictionRequest,
    risk_level: str,
    risk_score: int,
    suggested_action: str,
    top_risk_factors: list[str],
    contexts: list[RetrievedContext],
) -> str:
    factor_text = ", ".join(FACTOR_LABELS.get(factor, factor) for factor in top_risk_factors)
    policy_titles = ", ".join(context.title for context in contexts) if contexts else "internal risk policy"
    return (
        f"Booking #{request.booking_id} được phân loại rủi ro {RISK_LEVEL_LABELS.get(risk_level, risk_level)} với điểm {risk_score}/100. "
        f"Các tín hiệu rủi ro chính gồm: {factor_text}. "
        f"Gợi ý xử lý là '{ACTION_LABELS.get(suggested_action, suggested_action)}' dựa trên các mục policy được truy xuất: {policy_titles}."
    )


@lru_cache(maxsize=1)
def _load_chunks() -> tuple[KnowledgeChunk, ...]:
    chunks: list[KnowledgeChunk] = []
    if not KNOWLEDGE_DIR.exists():
        return tuple()

    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        chunks.extend(_split_markdown(path.name, path.read_text(encoding="utf-8")))

    return tuple(chunks)


def _split_markdown(source: str, text: str) -> list[KnowledgeChunk]:
    chunks: list[KnowledgeChunk] = []
    current_title = source
    current_lines: list[str] = []

    for line in text.splitlines():
        if line.startswith("## "):
            _append_chunk(chunks, source, current_title, current_lines)
            current_title = line.removeprefix("## ").strip()
            current_lines = []
            continue
        if line.startswith("# "):
            continue
        if line.strip():
            current_lines.append(line.strip())

    _append_chunk(chunks, source, current_title, current_lines)
    return chunks


def _append_chunk(chunks: list[KnowledgeChunk], source: str, title: str, lines: list[str]) -> None:
    content = " ".join(lines).strip()
    if not content:
        return
    chunks.append(KnowledgeChunk(source=source, title=title, content=content, tokens=tuple(_tokenize(f"{title} {content}"))))


def _build_query(request: RiskPredictionRequest, risk_level: str, top_risk_factors: list[str]) -> str:
    return " ".join(
        [
            risk_level,
            *top_risk_factors,
            f"trust score {request.trust_score}",
            f"cancel count {request.cancel_count}",
            f"duration {request.duration}",
            f"vehicle value {request.vehicle_value}",
        ]
    )


def _tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(text)]


def _cosine_tfidf(
    query_tokens: list[str],
    document_tokens: tuple[str, ...],
    document_frequency: dict[str, int],
    document_count: int,
) -> float:
    query_vector = _tfidf_vector(query_tokens, document_frequency, document_count)
    document_vector = _tfidf_vector(list(document_tokens), document_frequency, document_count)
    if not query_vector or not document_vector:
        return 0.0

    dot = sum(query_vector.get(token, 0.0) * document_vector.get(token, 0.0) for token in query_vector)
    query_norm = math.sqrt(sum(value * value for value in query_vector.values()))
    document_norm = math.sqrt(sum(value * value for value in document_vector.values()))
    if query_norm == 0 or document_norm == 0:
        return 0.0
    return dot / (query_norm * document_norm)


def _tfidf_vector(tokens: list[str], document_frequency: dict[str, int], document_count: int) -> dict[str, float]:
    term_frequency: dict[str, int] = {}
    for token in tokens:
        term_frequency[token] = term_frequency.get(token, 0) + 1

    vector: dict[str, float] = {}
    for token, count in term_frequency.items():
        idf = math.log((document_count + 1) / (document_frequency.get(token, 0) + 1)) + 1
        vector[token] = count * idf
    return vector

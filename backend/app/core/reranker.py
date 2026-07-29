import requests

from app.config import settings

_RERANK_URL = "https://api.cohere.com/v2/rerank"


def rerank(query: str, candidates: list[str]) -> list[float]:
    """Returns a relevance score per candidate, same order as input."""
    if not candidates:
        return []

    response = requests.post(
        _RERANK_URL,
        headers={"Authorization": f"Bearer {settings.cohere_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.reranker_model,
            "query": query,
            "documents": candidates,
            "top_n": len(candidates),
        },
        timeout=30,
    )
    response.raise_for_status()

    # Cohere returns results sorted by relevance with the original index, not
    # in input order -- restore input order so callers can zip scores 1:1.
    scores = [0.0] * len(candidates)
    for result in response.json()["results"]:
        scores[result["index"]] = result["relevance_score"]
    return scores

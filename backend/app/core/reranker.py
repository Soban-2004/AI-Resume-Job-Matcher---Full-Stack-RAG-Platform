import time

import requests

from app.config import settings

_RERANK_URL = "https://api.cohere.com/v2/rerank"


class RerankUnavailable(Exception):
    """Raised when Cohere's rerank endpoint is still unreachable, timing out,
    or rate-limited after a retry."""


def _post_rerank(query: str, candidates: list[str]) -> requests.Response:
    return requests.post(
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


def _scores_from_response(response: requests.Response, candidates: list[str]) -> list[float]:
    # Cohere returns results sorted by relevance with the original index, not
    # in input order -- restore input order so callers can zip scores 1:1.
    scores = [0.0] * len(candidates)
    for result in response.json()["results"]:
        scores[result["index"]] = result["relevance_score"]
    return scores


def rerank(query: str, candidates: list[str]) -> list[float]:
    """Returns a relevance score per candidate, same order as input.

    Cohere's trial rerank quota (10 req/min) is easy to hit here --
    retrieve_evidence calls this once per JD requirement, so a single resume
    with a 15-20 requirement JD can burn through it on its own. A transient
    timeout/connection error gets the same one-retry treatment as a 429 --
    both absorb a brief blip; if still failing after the retry, raises
    RerankUnavailable so the caller can fall back to a rerank-free ranking
    instead of failing the whole analysis.
    """
    if not candidates:
        return []

    try:
        response = _post_rerank(query, candidates)
    except requests.exceptions.RequestException:
        response = None

    if response is None or response.status_code == 429:
        time.sleep(6)  # a slice of the 60s window -- enough to clear a brief burst
        try:
            response = _post_rerank(query, candidates)
        except requests.exceptions.RequestException as e:
            raise RerankUnavailable("Cohere rerank unreachable after retry") from e
        if response.status_code == 429:
            raise RerankUnavailable("Cohere rerank rate-limited after retry")

    response.raise_for_status()
    return _scores_from_response(response, candidates)

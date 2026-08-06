import time

import numpy as np
import requests

from app.config import settings

_EMBED_URL = "https://api.cohere.com/v2/embed"
_EMBED_BATCH_SIZE = 96  # Cohere's per-request text limit


class EmbeddingUnavailable(Exception):
    """Raised when Cohere's embed endpoint is still unreachable/rate-limited
    after a retry. The message is user-facing -- it's what ends up shown in
    the UI via job_store.set_error(job_id, str(e)), so it stays plain-English
    instead of leaking the raw requests/urllib3 exception text.
    """


def _post_embed(batch: list[str], input_type: str) -> requests.Response:
    return requests.post(
        _EMBED_URL,
        headers={"Authorization": f"Bearer {settings.cohere_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.embedding_model,
            "texts": batch,
            "input_type": input_type,
            "embedding_types": ["float"],
        },
        timeout=30,
    )


def _embed_batch(batch: list[str], input_type: str) -> list[list[float]]:
    """A transient timeout/connection error or a 429 gets one retry (short
    backoff) before giving up -- unlike rerank, there's no fallback ranking
    to degrade to here, since dense vectors are load-bearing for retrieval
    itself, so an exhausted retry has to surface as a clean, user-facing
    error rather than crash with the raw network exception.
    """
    try:
        response = _post_embed(batch, input_type)
    except requests.exceptions.RequestException as e:
        time.sleep(3)
        try:
            response = _post_embed(batch, input_type)
        except requests.exceptions.RequestException:
            raise EmbeddingUnavailable(
                "Our embedding provider is temporarily unreachable. Please try again in a moment."
            ) from e

    if response.status_code == 429:
        time.sleep(6)
        response = _post_embed(batch, input_type)
        if response.status_code == 429:
            raise EmbeddingUnavailable(
                "Our embedding provider is temporarily rate-limited. Please try again in a moment."
            )

    response.raise_for_status()
    return response.json()["embeddings"]["float"]


def embed_texts(texts: list[str], input_type: str = "search_document") -> np.ndarray:
    """Returns L2-normalized embeddings, so a dot product equals cosine similarity.

    `input_type` should be "search_query" for text used to retrieve against
    stored chunks, and left at the "search_document" default for text being
    stored or compared symmetrically -- Cohere's embed model uses this to
    optimize the embedding for its role.
    """
    if not texts:
        return np.empty((0, 0))

    vectors: list[list[float]] = []
    for i in range(0, len(texts), _EMBED_BATCH_SIZE):
        batch = texts[i : i + _EMBED_BATCH_SIZE]
        vectors.extend(_embed_batch(batch, input_type))

    array = np.asarray(vectors)
    norms = np.linalg.norm(array, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return array / norms

import numpy as np
import requests

from app.config import settings

_EMBED_URL = "https://api.cohere.com/v2/embed"
_EMBED_BATCH_SIZE = 96  # Cohere's per-request text limit


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
        response = requests.post(
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
        response.raise_for_status()
        vectors.extend(response.json()["embeddings"]["float"])

    array = np.asarray(vectors)
    norms = np.linalg.norm(array, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return array / norms

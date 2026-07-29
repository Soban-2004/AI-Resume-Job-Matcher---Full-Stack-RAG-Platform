import threading
import time
from collections import defaultdict

from fastapi import HTTPException

from app.config import settings

# In-memory is enough here: Render's free-tier deploy runs a single worker
# process (WEB_CONCURRENCY=1), so there's no cross-process state to share.
_lock = threading.Lock()
_job_creation_times: dict[str, list[float]] = defaultdict(list)


def enforce_job_creation_rate_limit(user_id: str) -> None:
    """Caps how many analysis jobs one user can start in a rolling window.

    A free Supabase signup is no real barrier to someone scripting a loop
    against the job-creation endpoints, and each job triggers real
    Groq/Gemini/Cohere/Qdrant calls -- this is what actually protects those
    quotas now that the endpoints require auth.
    """
    now = time.time()
    window_start = now - settings.job_rate_limit_window_seconds

    with _lock:
        timestamps = _job_creation_times[user_id]
        timestamps[:] = [t for t in timestamps if t > window_start]
        if len(timestamps) >= settings.job_rate_limit_max_per_window:
            window_minutes = settings.job_rate_limit_window_seconds // 60
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Too many analyses started recently -- limit is "
                    f"{settings.job_rate_limit_max_per_window} every {window_minutes} minutes. "
                    "Try again shortly."
                ),
            )
        timestamps.append(now)

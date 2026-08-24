import datetime as dt
import threading
import time
from collections import defaultdict

from fastapi import HTTPException

from app.config import settings

# In-memory is enough here: Render's free-tier deploy runs a single worker
# process (WEB_CONCURRENCY=1), so there's no cross-process state to share.
_lock = threading.Lock()
_job_creation_times: dict[str, list[float]] = defaultdict(list)
_guest_ip_times: dict[str, list[float]] = defaultdict(list)
_guest_daily_count: dict[str, int] = {}  # ISO date -> count, see enforce_guest_rate_limit


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


def enforce_guest_rate_limit(client_key: str) -> None:
    """Caps unauthenticated guest-demo runs -- two layers, since there's no
    login barrier at all to lean on here (see create_guest_job in
    job_seeker.py, restricted to fixed sample data for the same reason):
    a per-IP cooldown against one abuser looping the endpoint, and a global
    daily cap across every guest combined so anonymous traffic can only ever
    eat a small, bounded slice of the shared LLM quota real signed-up users
    depend on.
    """
    now = time.time()
    today = dt.date.today().isoformat()

    with _lock:
        window_start = now - settings.guest_rate_limit_window_seconds
        timestamps = _guest_ip_times[client_key]
        timestamps[:] = [t for t in timestamps if t > window_start]
        if len(timestamps) >= settings.guest_rate_limit_max_per_window:
            window_minutes = settings.guest_rate_limit_window_seconds // 60
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Too many guest demo runs from this connection -- limit is "
                    f"{settings.guest_rate_limit_max_per_window} every {window_minutes} minutes. "
                    "Sign up for unlimited analyses, or try again shortly."
                ),
            )

        # Stale-date entries are harmless (one int each) and never pruned --
        # not worth the complexity at this project's scale.
        if _guest_daily_count.get(today, 0) >= settings.guest_daily_cap:
            raise HTTPException(
                status_code=429,
                detail="Guest demo runs are fully booked for today. Sign up to run your own analysis anytime.",
            )

        timestamps.append(now)
        _guest_daily_count[today] = _guest_daily_count.get(today, 0) + 1

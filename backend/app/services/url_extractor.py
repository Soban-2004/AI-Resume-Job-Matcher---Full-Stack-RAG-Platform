import re
from urllib.parse import urlparse

from app.models.schemas import ExtractedUrl

# Resumes rarely write "https://" -- catches bare "github.com/user" too, not
# just fully-qualified URLs.
_URL_PATTERN = re.compile(
    r"""(?xi)
    \b
    (?:https?://)?
    (?:www\.)?
    (
        github\.com/[\w.\-/]+
        | linkedin\.com/[\w.\-/]+
        | kaggle\.com/[\w.\-/]+
        | [\w.\-]+\.(?:dev|io|me|com|net|org|app|xyz)/[\w.\-/]*
    )
""",
)

# Anything on these hosts is a portfolio/blog/generic link, not a distinct
# platform -- classified separately below by hostname, not swept into the
# generic "portfolio" bucket that catches truly arbitrary personal sites.
_KNOWN_HOSTS = ("github.com", "linkedin.com", "kaggle.com")


def _normalize(raw: str) -> str:
    raw = raw.rstrip(".,;:)")
    return raw if raw.startswith("http") else f"https://{raw}"


def _classify(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    path_parts = [p for p in parsed.path.split("/") if p]

    if host == "github.com":
        if len(path_parts) >= 2:
            return "github_repo"
        if len(path_parts) == 1:
            return "github_profile"
        return "github_profile"
    if host == "linkedin.com":
        return "linkedin"
    if host == "kaggle.com":
        return "kaggle"
    return "portfolio"


def extract_urls(text: str) -> list[ExtractedUrl]:
    """Detects and classifies every URL in resume text -- pure text
    processing, no network calls. Deduplicated by normalized URL.
    """
    seen: dict[str, ExtractedUrl] = {}
    for match in _URL_PATTERN.finditer(text):
        url = _normalize(match.group(0))
        if url in seen:
            continue
        seen[url] = ExtractedUrl(url=url, kind=_classify(url))
    return list(seen.values())

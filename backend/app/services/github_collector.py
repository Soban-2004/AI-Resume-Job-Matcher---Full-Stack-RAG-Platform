import base64
import time
from dataclasses import dataclass
from urllib.parse import urlparse

import requests

from app.config import settings
from app.core.app_logging import get_logger
from app.models.schemas import ExtractedUrl

_API_BASE = "https://api.github.com"
_REQUEST_TIMEOUT = 8  # seconds, per HTTP call
_COLLECTION_TIME_BUDGET = 15  # seconds, total wall-clock across one candidate's whole collection


@dataclass
class ExternalEvidenceChunk:
    text: str
    source_url: str


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _get(path: str) -> dict | list | None:
    try:
        response = requests.get(f"{_API_BASE}{path}", headers=_headers(), timeout=_REQUEST_TIMEOUT)
    except requests.exceptions.RequestException:
        return None
    if response.status_code != 200:
        return None
    return response.json()


def _repo_path_from_url(url: str) -> tuple[str, str] | None:
    parts = [p for p in urlparse(url).path.split("/") if p]
    if len(parts) < 2:
        return None
    return parts[0], parts[1]


def _username_from_profile_url(url: str) -> str | None:
    parts = [p for p in urlparse(url).path.split("/") if p]
    return parts[0] if parts else None


def _repo_chunks(owner: str, repo: str) -> list[ExternalEvidenceChunk]:
    repo_url = f"https://github.com/{owner}/{repo}"
    chunks: list[ExternalEvidenceChunk] = []

    languages = _get(f"/repos/{owner}/{repo}/languages")
    if isinstance(languages, dict) and languages:
        chunks.append(
            ExternalEvidenceChunk(
                text=f"Repository {owner}/{repo} is written in: {', '.join(languages.keys())}.",
                source_url=repo_url,
            )
        )

    readme = _get(f"/repos/{owner}/{repo}/readme")
    if isinstance(readme, dict) and readme.get("content"):
        try:
            decoded = base64.b64decode(readme["content"]).decode("utf-8", errors="ignore")
        except (ValueError, UnicodeDecodeError):
            decoded = ""
        if decoded.strip():
            chunks.append(
                ExternalEvidenceChunk(
                    text=f"README of {owner}/{repo}:\n{decoded[: settings.github_readme_max_chars]}",
                    source_url=repo_url,
                )
            )

    return chunks


def collect_github_evidence(github_urls: list[ExtractedUrl]) -> list[ExternalEvidenceChunk]:
    """Fetches repo languages + READMEs for every GitHub link found in a
    resume, bounded by settings.github_max_repos_per_candidate and a total
    wall-clock time budget. Never raises -- a GitHub outage, rate limit, or a
    typo'd username just means less external evidence, not a failed analysis.
    """
    logger = get_logger()
    start = time.monotonic()
    repo_targets: list[tuple[str, str]] = []

    for link in github_urls:
        if time.monotonic() - start > _COLLECTION_TIME_BUDGET:
            break
        if link.kind == "github_repo":
            target = _repo_path_from_url(link.url)
            if target and target not in repo_targets:
                repo_targets.append(target)
        elif link.kind == "github_profile":
            username = _username_from_profile_url(link.url)
            if not username:
                continue
            repos = _get(f"/users/{username}/repos?sort=updated&per_page={settings.github_max_repos_per_candidate}")
            if isinstance(repos, list):
                for r in repos:
                    target = (username, r.get("name", ""))
                    if target[1] and target not in repo_targets:
                        repo_targets.append(target)

        if len(repo_targets) >= settings.github_max_repos_per_candidate:
            break

    repo_targets = repo_targets[: settings.github_max_repos_per_candidate]
    logger.debug("collect_github_evidence repo_targets=%r", repo_targets)

    chunks: list[ExternalEvidenceChunk] = []
    for owner, repo in repo_targets:
        if time.monotonic() - start > _COLLECTION_TIME_BUDGET:
            logger.warning("collect_github_evidence time budget exceeded, stopping early")
            break
        chunks.extend(_repo_chunks(owner, repo))

    return chunks

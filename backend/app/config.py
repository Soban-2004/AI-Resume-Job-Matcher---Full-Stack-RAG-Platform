from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at the project root (one level above backend/), shared with the
# legacy Streamlit app during the migration.
_ROOT_ENV = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    groq_api_key: str
    qdrant_url: str
    qdrant_api_key: str
    gemini_api_key: str = ""
    cohere_api_key: str = ""

    # Optional -- unauthenticated GitHub API access is capped at 60 req/hr,
    # fine for occasional job-seeker use but tight for recruiter batch runs.
    # A personal access token (no special scopes needed, just public repo
    # read access) raises that to 5000/hr.
    github_token: str = ""
    github_max_repos_per_candidate: int = 4
    github_readme_max_chars: int = 2000

    # llama-3.3-70b-versatile hit its 100k/day free-tier token quota during
    # testing, so we moved to llama-3.1-8b-instant for an untouched budget.
    # Groq deprecated BOTH of those on 2026-08-16 (see
    # console.groq.com/docs/deprecations); openai/gpt-oss-20b is Groq's own
    # recommended replacement for llama-3.1-8b-instant. Unlike that old
    # model, gpt-oss-20b is a reasoning model -- see _REASONING_MODEL_MIN_EFFORT
    # in core/llm.py for how its reasoning-token overhead is kept in check.
    llm_model: str = "openai/gpt-oss-20b"

    # qwen/qwen3.6-27b and openai/gpt-oss-20b both initially failed under
    # Groq's forced tool_choice -- as reasoning models, they burn part of
    # max_completion_tokens on an internal <think> trace before ever
    # emitting the tool call, and occasionally (~1-in-4 to ~1-in-2 observed
    # for gpt-oss-20b) emit a schema-valid but empty {"verdicts": []} tool
    # call instead of doing the work. Fixed by skipping tool-calling for
    # both and using plain-text completion instead (see
    # _evaluate_rubric_batch_plaintext / _PLAINTEXT_MODELS in
    # rag_matching.py) -- the exact reasoning_effort value each needs
    # ("none" for Qwen, "low" for gpt-oss -- gpt-oss 400s on "none")
    # is picked automatically per model by _REASONING_MODEL_MIN_EFFORT in
    # core/llm.py, not configured here.

    # The rubric check ("skill matching") runs a three-tier fallback chain by
    # default -- see _evaluate_rubric_batch_tiered in rag_matching.py:
    #   1. Gemma 4 31B via Ollama Cloud (free, ~14.4K req/day class quota --
    #      validated for citation accuracy on the full 16-requirement JD).
    #   2. Gemini 3.1 Flash Lite via Google AI Studio (good quality, 500
    #      req/day -- unlike full Gemini Flash's ~20/day, this tier actually
    #      gets exercised as a real second layer, not a token gesture).
    #   3. openai/gpt-oss-20b via Groq, routed through the plain-text path
    #      above (it's in _PLAINTEXT_MODELS) -- the most heavily-hardened
    #      path in this codebase; final safety net if both tiers above fail
    #      for any reason (quota, outage, malformed response -- see
    #      _evaluate_rubric_batch_tiered's broad catch for why we don't try
    #      to distinguish the failure cause for tiers 1-2). Was
    #      llama-3.1-8b-instant (a non-reasoning model, tool-calling was
    #      fine) until Groq deprecated it 2026-08-16.
    rubric_ollama_model: str = "gemma4:31b-cloud"
    rubric_gemini_model: str = "gemini-3.1-flash-lite"
    rubric_check_fallback_model: str = "openai/gpt-oss-20b"

    # Moved off local sentence-transformers/CrossEncoder (torch import + model
    # deserialization was the dominant chunk of cold-start time on a free-tier
    # host) to Cohere's hosted embed/rerank endpoints -- no local model to load.
    embedding_model: str = "embed-v4.0"
    reranker_model: str = "rerank-v3.5"

    # A bare mention in a Skills list and a fully demonstrated "built X using
    # Y" claim both used to score identical (satisfied=true, confidence=1.0)
    # -- easy to game by just listing every buzzword you can think of. The
    # LLM now only classifies WHICH of these categories the cited evidence
    # falls into (a small, reliable judgment call); this mapping is what
    # actually turns that classification into a score, kept here as plain
    # data so it's easy to tune after real-world testing without touching
    # the rubric prompt itself.
    # "external_verification" (corroborated by real external evidence, e.g. a
    # GitHub repo actually containing Kubernetes manifests) is trusted at the
    # same ceiling as demonstrated_usage -- an external artifact is at least
    # as credible as self-reported resume prose, not less.
    evidence_type_weights: dict[str, float] = {
        "skills_only": 0.50,
        "project_mention": 0.75,
        "experience_mention": 0.85,
        "demonstrated_usage": 1.00,
        "external_verification": 1.00,
    }

    # Groq's free tier caps llama-3.3-70b-versatile at 12,000 TPM. Running
    # candidates concurrently means several large rubric-scoring prompts
    # compete for that same rolling budget and collide. Instead we process
    # candidates fully sequentially and pace each Groq call to roughly one
    # per minute, so every call sees a close-to-fresh TPM window.
    recruiter_concurrency: int = 1
    recruiter_call_interval_seconds: float = 60.0

    # RAG chunking / retrieval tuning
    chunk_size: int = 400
    chunk_overlap: int = 60
    rrf_k: int = 60  # reciprocal-rank-fusion smoothing constant
    fusion_candidate_k: int = 10  # candidates kept after BM25+dense fusion, before rerank

    # A single rubric call covering every JD requirement can exceed smaller
    # models' per-request TPM ceiling (e.g. the old llama-3.1-8b-instant
    # capped at 6,000 TPM; a 19-requirement prompt needed 7,325). Batching
    # keeps each
    # call comfortably sized regardless of which model is plugged in.
    # `_reconcile_batch_verdicts()` is what makes batching safe from a
    # "missing/hallucinated requirement" standpoint -- it discards anything
    # the model invents and backfills a safe fallback for anything dropped --
    # but batch=4 surfaced a different failure mode it can't catch: with
    # several requirements competing for attention in one call, the model
    # started cross-attributing evidence between semantically similar items
    # (e.g. citing a Power BI snippet as "evidence" for a Tableau
    # requirement) and writing justifications that contradict their own
    # cited evidence. batch=3 with 4 evidence snippets trades back a little
    # speed for less cross-item confusion. Job-seeker uses these same tuned
    # values via the shared defaults; recruiter keeps its own separate
    # settings below in case its bulk-ranking needs ever diverge.
    evidence_top_k: int = 4  # final evidence snippets per requirement, after rerank
    rubric_batch_size: int = 3
    recruiter_rubric_batch_size: int = 3
    recruiter_evidence_top_k: int = 4

    # Three-round recruiter screening funnel, mirroring a real ATS pipeline
    # (bulk screen -> phone screen -> onsite) instead of spending equal LLM
    # budget on every candidate:
    #   Round 1 -- free, local, dense-cosine pre-filter (no Groq calls) over
    #     every candidate's resume chunks. Loose cut (~20%): only needs to not
    #     lose obviously-bad candidates, so its noise is tolerable here.
    #   Round 2 -- one Groq call per round-1 survivor to extract the resume's
    #     own skill list, then same-granularity skill-vs-skill cosine
    #     matching (much less noisy than round 1's chunk comparison). Tight
    #     cut (~5% of the original pool): still not evidence-grounded, so it
    #     narrows further but doesn't make the final call.
    #   Round 3 -- the expensive, evidence-grounded per-requirement LLM
    #     verification, unchanged, run only on round 2's survivors.
    # Each round pauses for explicit recruiter approval before the next one
    # starts (see job_store.JobState.AWAITING_APPROVAL) -- nothing after
    # round 1 runs without a human looking at the cut first.
    recruiter_round1_shortlist_percent: float = 0.40  # used when vacancies isn't given
    recruiter_round1_shortlist_multiplier: float = 6.0  # shortlist = vacancies * this
    recruiter_round1_shortlist_min: int = 3
    recruiter_prescreen_concurrency: int = 5  # round 1 is local-only, no Groq/pacing needed

    recruiter_round2_shortlist_percent: float = 0.05  # used when vacancies isn't given
    recruiter_round2_shortlist_multiplier: float = 3.0  # shortlist = vacancies * this
    recruiter_round2_shortlist_min: int = 2
    # Round 2's calls are single, light skill-extraction requests (no
    # evidence citation, no batching) -- much smaller than round 3's rubric
    # calls, so moderate concurrency is safe with call_structured's existing
    # 429 backoff as the safety net, rather than round 3's strict 60s pacing.
    recruiter_round2_concurrency: int = 3

    # Individual recruiter-to-candidate emails (interview invites, rejections,
    # etc.) -- one SMTP account configured for the whole app, not per-recruiter
    # OAuth. Empty smtp_host means the feature is simply unconfigured, and the
    # send endpoint reports that clearly rather than failing as a generic 500.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Recruiting Team"
    smtp_use_tls: bool = True

    # Caps how many analysis jobs one user can start per rolling window --
    # see app/core/rate_limit.py. A free Supabase signup is no real barrier
    # to someone scripting a loop against the job-creation endpoints, and
    # each job triggers real Groq/Gemini/Cohere/Qdrant calls.
    job_rate_limit_max_per_window: int = 10
    job_rate_limit_window_seconds: int = 3600

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    model_config = SettingsConfigDict(
        env_file=str(_ROOT_ENV),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

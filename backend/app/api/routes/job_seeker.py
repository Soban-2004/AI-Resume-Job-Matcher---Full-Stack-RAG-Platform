import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, Response, UploadFile

from app.core.auth import CurrentUser, get_current_user
from app.core.rate_limit import enforce_guest_rate_limit, enforce_job_creation_rate_limit
from app.db import crud
from app.db.session import get_db_session
from app.models.schemas import (
    CandidateStatus,
    JobSeekerAnalysisResponse,
    JobStatusResponse,
    OptimizedResume,
    StageStatus,
)
from app.services import job_store
from app.services.document_loader import load_document
from app.services.guest_samples import GUEST_SAMPLES
from app.services.job_seeker_service import analyze_job_seeker, generate_cover_letter
from app.services.job_store import StepState
from app.services.resume_optimizer import optimize_and_verify
from app.services.resume_pdf import render_resume_pdf

router = APIRouter(prefix="/api/job-seeker", tags=["job-seeker"])

_STAGE_DEFS = [
    ("eligibility", "Checking eligibility"),
    ("requirements", "Extracting job requirements"),
    ("indexing", "Indexing resume"),
    ("retrieval", "Retrieving evidence"),
    ("scoring", "Scoring requirements"),
]


def _persist_report(
    user_id: str,
    resume_filename: str,
    resume_text: str,
    resume_bytes: bytes | None,
    resume_content_type: str | None,
    job_role: str,
    jd_text: str,
    result: JobSeekerAnalysisResponse,
) -> str:
    # Runs after the response for this analysis job is already being polled
    # as "completed" -- a fresh, short-lived session here rather than a
    # request-scoped one, since background tasks outlive the request.
    db = get_db_session()
    try:
        resume = crud.save_resume(db, user_id, resume_filename, resume_text, resume_bytes, resume_content_type)
        report = crud.save_analysis_report(db, user_id, resume.id, resume_filename, job_role, jd_text, result)
        return report.id
    finally:
        db.close()


async def _run_job(
    job_id: str,
    resume_text: str,
    resume_filename: str,
    resume_bytes: bytes | None,
    resume_content_type: str | None,
    jd_text: str,
    job_role: str,
    user_id: str | None,
) -> None:
    # user_id is None for the unauthenticated guest-demo path (see
    # create_guest_job) -- there's no account to own a saved resume/report
    # under, so persistence below is skipped entirely for those runs. The
    # result itself still lives in job_store for polling like any other job.
    job_store.set_running(job_id)

    def on_stage(stage: str, state: str) -> None:
        job_store.update_stage(job_id, stage, StepState(state))

    def on_partial(**fields) -> None:
        job_store.update_partial(job_id, **fields)

    def on_activity(text: str) -> None:
        job_store.set_activity(job_id, f"Checking: {text}")

    def on_verdict(verdict) -> None:
        job_store.append_verdict(job_id, verdict)

    def should_stop() -> bool:
        return job_store.is_stop_requested(job_id)

    try:
        result = await asyncio.to_thread(
            analyze_job_seeker,
            resume_text,
            jd_text,
            job_role,
            on_stage=on_stage,
            on_partial=on_partial,
            on_activity=on_activity,
            on_verdict=on_verdict,
            should_stop=should_stop,
        )
        job_store.set_activity(job_id, None)
        if job_store.is_stop_requested(job_id):
            job_store.set_stopped(job_id, result)
        else:
            job_store.set_result(job_id, result)
            if user_id is not None and not job_store.is_stop_requested(job_id):
                report_id = _persist_report(
                    user_id, resume_filename, resume_text, resume_bytes, resume_content_type, job_role, jd_text, result
                )
                job_store.set_report_id(job_id, report_id)
    except Exception as e:
        job_store.set_activity(job_id, None)
        job_store.set_error(job_id, str(e))


@router.post("/jobs")
async def create_job(
    background_tasks: BackgroundTasks,
    resume: UploadFile = File(...),
    job_description: UploadFile = File(...),
    job_role: str = Form(...),
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    enforce_job_creation_rate_limit(user.id)

    resume_bytes = await resume.read()
    jd_bytes = await job_description.read()

    resume_text = load_document(resume.filename or "", resume_bytes)
    jd_text = load_document(job_description.filename or "", jd_bytes)

    if not resume_text or not jd_text:
        raise HTTPException(status_code=400, detail="Could not read one or both files.")

    job = job_store.create_job("job_seeker", stage_defs=_STAGE_DEFS)
    background_tasks.add_task(
        _run_job,
        job.id,
        resume_text,
        resume.filename or "resume",
        resume_bytes,
        resume.content_type,
        jd_text,
        job_role,
        user.id,
    )
    return {"job_id": job.id}


def _client_key(request: Request) -> str:
    # Render sits behind a reverse proxy -- request.client.host alone would
    # just be the proxy's own address, useless for per-visitor limiting.
    # X-Forwarded-For's first entry is the original client when present.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/guest-jobs")
async def create_guest_job(
    background_tasks: BackgroundTasks,
    request: Request,
    sample_role: str = Form(...),
) -> dict:
    """Unauthenticated demo path -- no login, but also no client-submitted
    resume/JD text: sample_role only ever selects one of GUEST_SAMPLES'
    fixed, server-side pairs, so this can never become a free-form pipeline
    an anonymous caller controls the input to. See enforce_guest_rate_limit
    for why that restriction matters as much as the rate limit itself.
    """
    enforce_guest_rate_limit(_client_key(request))

    sample = GUEST_SAMPLES.get(sample_role)
    if not sample:
        raise HTTPException(status_code=400, detail="Unknown sample role.")

    job = job_store.create_job("job_seeker", stage_defs=_STAGE_DEFS)
    background_tasks.add_task(
        _run_job,
        job.id,
        sample.resume_text,
        "sample-resume.txt",
        None,
        None,
        sample.jd_text,
        sample.role,
        None,
    )
    return {"job_id": job.id}


@router.get("/resumes")
async def list_resumes(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    db = get_db_session()
    try:
        resumes = crud.list_resumes(db, user.id)
        return [{"id": r.id, "filename": r.filename, "created_at": r.created_at.isoformat()} for r in resumes]
    finally:
        db.close()


@router.get("/resumes/{resume_id}")
async def get_resume(resume_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    db = get_db_session()
    try:
        resume = crud.get_resume(db, user.id, resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")
        return {
            "id": resume.id,
            "filename": resume.filename,
            "resume_text": resume.resume_text,
            # content_type is null for resumes saved before file_bytes existed
            # -- the frontend falls back to the plain-text view for those.
            "content_type": resume.content_type if resume.file_bytes else None,
            "created_at": resume.created_at.isoformat(),
        }
    finally:
        db.close()


@router.get("/resumes/{resume_id}/file")
async def get_resume_file(resume_id: str, user: CurrentUser = Depends(get_current_user)) -> Response:
    """Serves the original uploaded bytes for format-native viewing (PDF in
    an iframe, DOCX through a client-side converter) -- resume_text alone
    only ever has the plain extracted content, not the real document."""
    db = get_db_session()
    try:
        resume = crud.get_resume(db, user.id, resume_id)
    finally:
        db.close()
    if not resume or not resume.file_bytes:
        raise HTTPException(status_code=404, detail="No original file stored for this resume.")
    return Response(
        content=resume.file_bytes,
        media_type=resume.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{resume.filename}"'},
    )


@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    db = get_db_session()
    try:
        deleted = crud.delete_resume(db, user.id, resume_id)
    finally:
        db.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return {"status": "deleted"}


@router.get("/reports")
async def list_reports(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    db = get_db_session()
    try:
        reports = crud.list_analysis_reports(db, user.id)
        return [
            {
                "id": r.id,
                "resume_filename": r.resume_filename,
                "job_role": r.job_role,
                "overall_fit_score": r.overall_fit_score,
                "skill_based_ats_score": r.skill_based_ats_score,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ]
    finally:
        db.close()


@router.get("/reports/{report_id}", response_model=JobSeekerAnalysisResponse)
async def get_report(report_id: str, user: CurrentUser = Depends(get_current_user)) -> JobSeekerAnalysisResponse:
    db = get_db_session()
    try:
        report = crud.get_analysis_report(db, user.id, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        return JobSeekerAnalysisResponse.model_validate(report.result_json)
    finally:
        db.close()


def _load_report_and_resume(db, user_id: str, report_id: str):
    report = crud.get_analysis_report(db, user_id, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    resume = crud.get_resume(db, user_id, report.resume_id) if report.resume_id else None
    if not resume:
        raise HTTPException(
            status_code=409,
            detail="The original resume for this report is no longer available.",
        )
    return report, resume


@router.post("/reports/{report_id}/cover-letter", response_model=JobSeekerAnalysisResponse)
async def generate_report_cover_letter(
    report_id: str, user: CurrentUser = Depends(get_current_user)
) -> JobSeekerAnalysisResponse:
    """Generated on demand rather than as part of every analysis -- see
    include_cover_letter in analyze_job_seeker. Re-generating overwrites any
    previous cover letter on this report."""
    enforce_job_creation_rate_limit(user.id)
    db = get_db_session()
    try:
        report, resume = _load_report_and_resume(db, user.id, report_id)
        result = JobSeekerAnalysisResponse.model_validate(report.result_json)
        result.cover_letter = generate_cover_letter(resume.resume_text, report.job_desc_text)
        updated = crud.update_analysis_report_result(db, user.id, report_id, result)
        return JobSeekerAnalysisResponse.model_validate(updated.result_json)
    finally:
        db.close()


@router.post("/reports/{report_id}/optimized-resume", response_model=JobSeekerAnalysisResponse)
async def generate_report_optimized_resume(
    report_id: str, user: CurrentUser = Depends(get_current_user)
) -> JobSeekerAnalysisResponse:
    """Generated on demand -- see include_optimized_resume in
    analyze_job_seeker. Re-generating overwrites any previous rewrite on this
    report."""
    enforce_job_creation_rate_limit(user.id)
    db = get_db_session()
    try:
        report, resume = _load_report_and_resume(db, user.id, report_id)
        result = JobSeekerAnalysisResponse.model_validate(report.result_json)
        result.optimized_resume = optimize_and_verify(resume.resume_text, report.job_desc_text)
        updated = crud.update_analysis_report_result(db, user.id, report_id, result)
        return JobSeekerAnalysisResponse.model_validate(updated.result_json)
    finally:
        db.close()


@router.delete("/reports/{report_id}")
async def delete_report(report_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    db = get_db_session()
    try:
        deleted = crud.delete_analysis_report(db, user.id, report_id)
    finally:
        db.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"status": "deleted"}


@router.post("/optimized-resume/pdf")
async def render_optimized_resume_pdf(resume: OptimizedResume) -> Response:
    """Stateless by design -- the client already has the full optimized-resume
    object from the analysis response, so rendering doesn't need to look
    anything up by job_id (which would tie the download to job_store's
    in-memory lifetime).
    """
    pdf_bytes = render_resume_pdf(resume)
    filename = (resume.full_name or "resume").strip().replace(" ", "_") + "_optimized.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/jobs/{job_id}/stop")
async def stop_job(job_id: str) -> dict:
    """Requests the job stop at its next checkpoint (before the next rubric
    batch, or before cover-letter/improvements start). A batch already sent
    to Groq finishes; nothing new starts after that.
    """
    if not job_store.request_stop(job_id):
        job = job_store.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")
        raise HTTPException(status_code=400, detail="Job already finished.")
    return {"status": "stopping"}


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(job_id: str) -> JobStatusResponse:
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JobStatusResponse(
        job_id=job.id,
        kind=job.kind,
        state=job.state.value,
        stages=[StageStatus(key=s.key, label=s.label, state=s.state.value) for s in job.stages],
        candidates=[
            CandidateStatus(filename=c.filename, state=c.state.value, score=c.score) for c in job.candidates
        ],
        partial=job.partial,
        verdicts=job.verdicts,
        current_activity=job.current_activity,
        result=job.result,
        error=job.error,
        report_id=job.report_id,
    )

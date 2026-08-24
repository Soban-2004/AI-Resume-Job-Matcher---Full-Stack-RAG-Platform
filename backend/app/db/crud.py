from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AnalysisReport, ProjectCandidate, RecruitmentProject, Resume
from app.models.schemas import CandidateResult, JobSeekerAnalysisResponse


def save_resume(
    db: Session,
    user_id: str,
    filename: str,
    resume_text: str,
    file_bytes: bytes | None = None,
    content_type: str | None = None,
) -> Resume:
    # One row per (user, filename) -- re-analyzing the same resume overwrites
    # its stored text instead of accumulating duplicates in the library.
    existing = db.scalar(
        select(Resume).where(Resume.user_id == user_id, Resume.filename == filename)
    )
    if existing:
        existing.resume_text = resume_text
        existing.file_bytes = file_bytes
        existing.content_type = content_type
        db.commit()
        db.refresh(existing)
        return existing

    resume = Resume(
        user_id=user_id,
        filename=filename,
        resume_text=resume_text,
        file_bytes=file_bytes,
        content_type=content_type,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def list_resumes(db: Session, user_id: str) -> list[Resume]:
    return list(
        db.scalars(select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc()))
    )


def get_resume(db: Session, user_id: str, resume_id: str) -> Resume | None:
    return db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id))


def delete_resume(db: Session, user_id: str, resume_id: str) -> bool:
    """Scoped to user_id so one user can never delete another's resume by
    guessing an ID. Only removes the resume row -- any AnalysisReport rows
    referencing it via resume_id keep working for viewing (result_json
    already has the full saved result), they just lose the ability to
    generate a fresh cover letter/optimized resume off it afterward (see
    _load_report_and_resume's 409, an already-handled case)."""
    resume = get_resume(db, user_id, resume_id)
    if not resume:
        return False
    db.delete(resume)
    db.commit()
    return True


def save_analysis_report(
    db: Session,
    user_id: str,
    resume_id: str | None,
    resume_filename: str,
    job_role: str,
    job_desc_text: str,
    result: JobSeekerAnalysisResponse,
) -> AnalysisReport:
    report = AnalysisReport(
        user_id=user_id,
        resume_id=resume_id,
        resume_filename=resume_filename,
        job_role=job_role,
        job_desc_text=job_desc_text,
        result_json=result.model_dump(mode="json"),
        overall_fit_score=result.overall_fit_score,
        skill_based_ats_score=result.skill_based_ats_score,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_analysis_reports(db: Session, user_id: str) -> list[AnalysisReport]:
    return list(
        db.scalars(
            select(AnalysisReport).where(AnalysisReport.user_id == user_id).order_by(AnalysisReport.created_at.desc())
        )
    )


def get_analysis_report(db: Session, user_id: str, report_id: str) -> AnalysisReport | None:
    return db.scalar(
        select(AnalysisReport).where(AnalysisReport.id == report_id, AnalysisReport.user_id == user_id)
    )


def update_analysis_report_result(
    db: Session, user_id: str, report_id: str, result: JobSeekerAnalysisResponse
) -> AnalysisReport | None:
    """Used by the on-demand cover-letter/optimized-resume endpoints -- the
    caller mutates just that one field on the already-loaded result and
    passes the whole object back in, so this stays a plain overwrite rather
    than needing per-field update logic here."""
    report = get_analysis_report(db, user_id, report_id)
    if not report:
        return None
    report.result_json = result.model_dump(mode="json")
    db.commit()
    db.refresh(report)
    return report


def delete_analysis_report(db: Session, user_id: str, report_id: str) -> bool:
    """Scoped to user_id so one user can never delete another's report by
    guessing an ID. Only removes the report row -- the underlying resume
    (shared across a user's whole library) is untouched."""
    report = get_analysis_report(db, user_id, report_id)
    if not report:
        return False
    db.delete(report)
    db.commit()
    return True


def create_project(
    db: Session,
    recruiter_id: str,
    name: str,
    job_role: str,
    job_desc_text: str,
    num_vacancies: int | None,
) -> RecruitmentProject:
    project = RecruitmentProject(
        recruiter_id=recruiter_id,
        name=name,
        job_role=job_role,
        job_desc_text=job_desc_text,
        num_vacancies=num_vacancies,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, recruiter_id: str) -> list[RecruitmentProject]:
    return list(
        db.scalars(
            select(RecruitmentProject)
            .where(RecruitmentProject.recruiter_id == recruiter_id)
            .order_by(RecruitmentProject.updated_at.desc())
        )
    )


def get_project(db: Session, recruiter_id: str, project_id: str) -> RecruitmentProject | None:
    return db.scalar(
        select(RecruitmentProject).where(
            RecruitmentProject.id == project_id, RecruitmentProject.recruiter_id == recruiter_id
        )
    )


def delete_project(db: Session, recruiter_id: str, project_id: str) -> bool:
    """Scoped to recruiter_id so one recruiter can never delete another's
    project by guessing an ID. No ORM cascade is configured, so candidates
    are deleted explicitly before the project row itself.
    """
    project = get_project(db, recruiter_id, project_id)
    if not project:
        return False
    db.query(ProjectCandidate).filter(ProjectCandidate.project_id == project_id).delete()
    db.delete(project)
    db.commit()
    return True


def save_project_candidates(db: Session, project_id: str, candidates: list[CandidateResult]) -> None:
    for c in candidates:
        db.add(
            ProjectCandidate(
                project_id=project_id,
                filename=c.filename,
                eligible=c.eligible,
                reasons=c.reasons,
                experience_years=c.experience_years,
                candidate_name=c.candidate_name,
                candidate_email=c.candidate_email,
                candidate_phone=c.candidate_phone,
                overall_fit_score=c.overall_fit_score,
                skill_based_ats_score=c.skill_based_ats_score,
                matched_requirements=c.matched_requirements,
                missing_requirements=c.missing_requirements,
                requirement_verdicts=[v.model_dump(mode="json") for v in c.requirement_verdicts],
                provisional_score=c.provisional_score,
                skill_match_score=c.skill_match_score,
                shortlisted=c.shortlisted,
                round_reached=c.round_reached,
            )
        )
    project = db.get(RecruitmentProject, project_id)
    if project:
        from datetime import datetime, timezone

        project.updated_at = datetime.now(timezone.utc)
    db.commit()


def list_project_candidates(db: Session, project_id: str) -> list[ProjectCandidate]:
    return list(
        db.scalars(
            select(ProjectCandidate)
            .where(ProjectCandidate.project_id == project_id)
            .order_by(ProjectCandidate.overall_fit_score.desc())
        )
    )


def candidate_email_belongs_to_recruiter(db: Session, recruiter_id: str, email: str) -> bool:
    """Used to stop /send-email being an open relay to arbitrary addresses --
    a recruiter can only email someone who's actually a candidate in one of
    their own projects."""
    match = db.scalar(
        select(ProjectCandidate.id)
        .join(RecruitmentProject, ProjectCandidate.project_id == RecruitmentProject.id)
        .where(RecruitmentProject.recruiter_id == recruiter_id, ProjectCandidate.candidate_email == email)
    )
    return match is not None

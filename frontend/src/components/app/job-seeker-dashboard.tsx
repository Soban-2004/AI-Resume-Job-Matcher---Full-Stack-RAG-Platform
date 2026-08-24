"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { ConfirmDeleteButton } from "@/components/app/confirm-delete-button";
import { scoreTone, TONE_TEXT } from "@/lib/score-tone";
import { deleteReport, deleteResume, listReports, listResumes } from "@/lib/api";
import { GRADIENT_CTA } from "@/lib/category-theme";
import { cn } from "@/lib/utils";
import type { ReportSummary, ResumeLibraryItem } from "@/lib/types";

function ReportRow({
  report,
  onView,
  onDeleted,
}: {
  report: ReportSummary;
  onView: (reportId: string) => void;
  onDeleted: (reportId: string) => void;
}) {
  const tone = scoreTone(report.skill_based_ats_score);

  return (
    <div className="flex w-full items-center gap-1 rounded-lg border border-border pr-1.5 transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={() => onView(report.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
      >
        <Sparkles className="size-4 shrink-0 text-primary" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{report.job_role}</span>
          <span className="truncate text-xs text-muted-foreground">{report.resume_filename}</span>
        </div>
        <span className={cn("shrink-0 text-sm font-semibold tabular-nums", TONE_TEXT[tone])}>
          {Math.round(report.skill_based_ats_score)}%
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(report.created_at).toLocaleDateString()}
        </span>
      </button>
      <ConfirmDeleteButton
        label="Delete report"
        onDelete={() => deleteReport(report.id)}
        onDeleted={() => onDeleted(report.id)}
      />
    </div>
  );
}

function ResumeRow({
  resume,
  onView,
  onDeleted,
}: {
  resume: ResumeLibraryItem;
  onView: (resumeId: string) => void;
  onDeleted: (resumeId: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-1 rounded-lg border border-transparent pr-1.5 transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={() => onView(resume.id)}
        className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-sm text-foreground/80 hover:text-foreground"
      >
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{resume.filename}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {new Date(resume.created_at).toLocaleDateString()}
        </span>
      </button>
      <ConfirmDeleteButton
        label="Delete resume"
        onDelete={() => deleteResume(resume.id)}
        onDeleted={() => onDeleted(resume.id)}
      />
    </div>
  );
}

export function JobSeekerDashboard({
  onNewAnalysis,
  onViewReport,
  onViewResume,
}: {
  onNewAnalysis: () => void;
  onViewReport: (reportId: string) => void;
  onViewResume: (resumeId: string) => void;
}) {
  const [resumes, setResumes] = useState<ResumeLibraryItem[] | null>(null);
  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listResumes(), listReports()])
      .then(([r, rep]) => {
        setResumes(r);
        setReports(rep);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load your dashboard."));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Button size="lg" className={cn("w-fit gap-2", GRADIENT_CTA)} onClick={onNewAnalysis}>
        <Plus className="size-4" />
        New Analysis
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-sm font-medium text-muted-foreground">Your Resumes</h2>
        {resumes === null && !error && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        )}
        {resumes && resumes.length === 0 && (
          <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
        )}
        {resumes && resumes.length > 0 && (
          <ul className="flex flex-col gap-1">
            {resumes.map((r) => (
              <li key={r.id}>
                <ResumeRow
                  resume={r}
                  onView={onViewResume}
                  onDeleted={(id) => setResumes((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-sm font-medium text-muted-foreground">Recent Reports</h2>
        {reports === null && !error && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {reports && reports.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No saved reports yet -- run a new analysis to build your history.
          </p>
        )}
        {reports && reports.length > 0 && (
          <StaggerGroup className="flex flex-col gap-2">
            {reports.map((r) => (
              <StaggerItem key={r.id}>
                <ReportRow
                  report={r}
                  onView={onViewReport}
                  onDeleted={(id) => setReports((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Compass, RotateCcw, Sparkles, Square, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/app/file-dropzone";
import { ScoreRing } from "@/components/app/score-ring";
import { StageProgressList } from "@/components/app/stage-progress";
import { ActivityTicker } from "@/components/app/activity-ticker";
import { EligibilitySnapshot } from "@/components/app/eligibility-snapshot";
import { LiveRequirementChecklist } from "@/components/app/live-requirement-checklist";
import { AnalysisResultView } from "@/components/app/analysis-result-view";
import { JobSeekerDashboard } from "@/components/app/job-seeker-dashboard";
import { ResumeViewer } from "@/components/app/resume-viewer";
import { BlurFadeIn } from "@/components/motion/reveal";
import { GRADIENT_CTA } from "@/lib/category-theme";
import { createJobSeekerJob, getJobSeekerJob, getReport, getResume, stopJobSeekerJob } from "@/lib/api";
import { useJobPolling } from "@/lib/use-job-polling";
import { cn } from "@/lib/utils";
import { SAMPLE_SETS } from "@/lib/sample-sets";
import { computeProvisionalScore } from "@/lib/scoring";
import type { JobSeekerAnalysisResponse, ResumeDetail } from "@/lib/types";

type View = "dashboard" | "form" | "report" | "resume";

export default function JobSeekerPage() {
  const [view, setView] = useState<View>("dashboard");
  const [viewedReport, setViewedReport] = useState<JobSeekerAnalysisResponse | null>(null);
  const [viewedReportId, setViewedReportId] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [viewedResume, setViewedResume] = useState<ResumeDetail | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  // Overrides status.result once the user generates a cover letter/optimized
  // resume on demand -- status is owned by useJobPolling and stops updating
  // once the job completes, so this is the only place a post-completion edit
  // can live.
  const [resultOverride, setResultOverride] = useState<JobSeekerAnalysisResponse | null>(null);

  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stopping, setStopping] = useState(false);

  // "sample" mode swaps the file dropzones for two freely-editable textareas
  // pre-filled from a chosen role's sample pair -- edits are just string
  // mutations here, and only get packaged into synthetic .txt Files (same
  // shape the upload path already produces) at submit time.
  const [inputMode, setInputMode] = useState<"upload" | "sample">("upload");
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [sampleResumeText, setSampleResumeText] = useState("");
  const [sampleJdText, setSampleJdText] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);

  const { status, pollError } = useJobPolling(jobId, getJobSeekerJob);

  const canSubmit =
    !submitting &&
    jobRole.trim().length > 0 &&
    (inputMode === "upload"
      ? resume && jobDescription
      : sampleResumeText.trim().length > 0 && sampleJdText.trim().length > 0);

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);
    setResultOverride(null);
    try {
      const [resumeFile, jdFile] =
        inputMode === "upload"
          ? [resume, jobDescription]
          : [
              new File([sampleResumeText], "sample-resume.txt", { type: "text/plain" }),
              new File([sampleJdText], "sample-job-description.txt", { type: "text/plain" }),
            ];
      if (!resumeFile || !jdFile) return;
      const id = await createJobSeekerJob(resumeFile, jdFile, jobRole.trim());
      setJobId(id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSelectSample(role: string, resumePath: string, jdPath: string) {
    setSubmitError(null);
    setSelectedSample(role);
    setLoadingSample(true);
    try {
      const [resumeText, jdText] = await Promise.all([
        fetch(resumePath).then((r) => r.text()),
        fetch(jdPath).then((r) => r.text()),
      ]);
      setSampleResumeText(resumeText);
      setSampleJdText(jdText);
      setJobRole(role);
    } catch {
      setSubmitError("Couldn't load that sample. Please try again or upload your own files.");
    } finally {
      setLoadingSample(false);
    }
  }

  async function handleViewReport(reportId: string) {
    setReportError(null);
    setViewedReport(null);
    setViewedReportId(reportId);
    setView("report");
    try {
      const report = await getReport(reportId);
      setViewedReport(report);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Failed to load report.");
    }
  }

  async function handleViewResume(resumeId: string) {
    setResumeError(null);
    setViewedResume(null);
    setView("resume");
    try {
      const resume = await getResume(resumeId);
      setViewedResume(resume);
    } catch (e) {
      setResumeError(e instanceof Error ? e.message : "Failed to load resume.");
    }
  }

  async function handleStop() {
    if (!jobId) return;
    setStopping(true);
    try {
      await stopJobSeekerJob(jobId);
    } finally {
      setStopping(false);
    }
  }

  function handleReset() {
    setJobId(null);
    setResume(null);
    setJobDescription(null);
    setJobRole("");
    setInputMode("upload");
    setSelectedSample(null);
    setSampleResumeText("");
    setSampleJdText("");
    setSubmitError(null);
    setViewedReport(null);
    setViewedReportId(null);
    setViewedResume(null);
    setResumeError(null);
    setResultOverride(null);
    setView("dashboard");
  }

  const result = (resultOverride ?? status?.result) as JobSeekerAnalysisResponse | null;
  // `jobId &&` matters here: useJobPolling doesn't clear its last `status`
  // when jobId resets to null (e.g. "Start over"), so without this guard the
  // stale completed-job status would keep the results view rendered
  // underneath the dashboard instead of actually returning to it.
  const isRunning =
    jobId && status && status.state !== "completed" && status.state !== "failed" && status.state !== "stopped";
  const jdRequirements = status?.partial.jd_requirements ?? [];
  const showFinalResult =
    jobId && (status?.state === "completed" || status?.state === "stopped") && result && result.eligibility.eligible;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <div className="flex items-center gap-2">
          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              disabled={stopping || status?.state === "stopped"}
              className="gap-1.5"
            >
              <Square className="size-3.5" />
              {stopping ? "Stopping..." : "Stop"}
            </Button>
          )}
          {(jobId || view !== "dashboard") && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="size-3.5" />
              {jobId ? "Start over" : "Back to dashboard"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Job Seeker Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Upload your resume and the job description you&apos;re targeting.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!jobId && view === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <JobSeekerDashboard
              onNewAnalysis={() => setView("form")}
              onViewReport={handleViewReport}
              onViewResume={handleViewResume}
            />
          </motion.div>
        )}

        {!jobId && view === "report" && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            {reportError && (
              <Alert variant="destructive">
                <AlertDescription>{reportError}</AlertDescription>
              </Alert>
            )}
            {viewedReport && (
              <AnalysisResultView result={viewedReport} reportId={viewedReportId} onResultChange={setViewedReport} />
            )}
          </motion.div>
        )}

        {!jobId && view === "resume" && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            {resumeError && (
              <Alert variant="destructive">
                <AlertDescription>{resumeError}</AlertDescription>
              </Alert>
            )}
            {!viewedResume && !resumeError && (
              <Card className="flex flex-col gap-3 p-6">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            )}
            {viewedResume && (
              <Card className="flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{viewedResume.filename}</h2>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Uploaded {new Date(viewedResume.created_at).toLocaleDateString()}
                  </span>
                </div>
                <ResumeViewer key={viewedResume.id} resume={viewedResume} />
              </Card>
            )}
          </motion.div>
        )}

        {!jobId && view === "form" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <Card className="flex flex-col gap-6 p-6">
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "upload" | "sample")}>
                <TabsList className="w-full">
                  <TabsTrigger value="upload">Upload files</TabsTrigger>
                  <TabsTrigger value="sample" className="gap-1.5">
                    <Wand2 className="size-3.5" />
                    Try a sample
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="flex flex-col gap-6 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FileDropzone
                      label="Resume"
                      hint="PDF, DOCX, or TXT"
                      accept=".pdf,.docx,.txt"
                      file={resume}
                      onChange={setResume}
                    />
                    <FileDropzone
                      label="Job Description"
                      hint="PDF, DOCX, or TXT"
                      accept=".pdf,.docx,.txt"
                      file={jobDescription}
                      onChange={setJobDescription}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sample" className="flex flex-col gap-4 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_SETS.map((s) => (
                      <Button
                        key={s.role}
                        type="button"
                        variant={selectedSample === s.role ? "default" : "outline"}
                        size="sm"
                        disabled={loadingSample}
                        onClick={() => handleSelectSample(s.role, s.resumePath, s.jdPath)}
                      >
                        {s.role}
                      </Button>
                    ))}
                  </div>
                  {selectedSample ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Loaded the {selectedSample} sample -- edit either side freely before analyzing.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="sample-resume">Resume</Label>
                          <Textarea
                            id="sample-resume"
                            className="min-h-64 font-mono text-xs"
                            value={sampleResumeText}
                            onChange={(e) => setSampleResumeText(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="sample-jd">Job Description</Label>
                          <Textarea
                            id="sample-jd"
                            className="min-h-64 font-mono text-xs"
                            value={sampleJdText}
                            onChange={(e) => setSampleJdText(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                      Pick a role above to load an editable sample resume and job description.
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="job-role">Job role</Label>
                <Input
                  id="job-role"
                  placeholder="e.g. Data Analyst, Backend Engineer"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <Button onClick={handleSubmit} disabled={!canSubmit} size="lg" className={cn("gap-2", GRADIENT_CTA)}>
                <Sparkles className="size-4" />
                {submitting ? "Starting analysis..." : "Analyze Resume Match"}
              </Button>
            </Card>
          </motion.div>
        )}

        {isRunning && (
          <motion.div
            key="running"
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <Card className="flex flex-col gap-4 p-6">
              <h2 className="text-sm font-medium text-muted-foreground">Analyzing your resume&hellip;</h2>
              <StageProgressList stages={status.stages} />
              <ActivityTicker text={status.current_activity} />
            </Card>

            <EligibilitySnapshot partial={status.partial} />

            {jdRequirements.length > 0 && (
              <BlurFadeIn>
                <Card className="flex flex-wrap items-center justify-around gap-8 p-8">
                  <ScoreRing
                    label="Skill-Based ATS Score"
                    score={computeProvisionalScore(jdRequirements, status.verdicts)}
                    provisional
                  />
                </Card>
              </BlurFadeIn>
            )}

            {jdRequirements.length > 0 && (
              <Card className="flex flex-col gap-4 p-6">
                <h2 className="text-lg font-semibold text-foreground">Requirement Breakdown</h2>
                <LiveRequirementChecklist jdRequirements={jdRequirements} verdicts={status.verdicts} />
              </Card>
            )}

            {status.partial.cover_letter && (
              <BlurFadeIn>
                <Card className="flex flex-col gap-3 p-6">
                  <h2 className="text-lg font-semibold text-foreground">Tailored Cover Letter</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                    {status.partial.cover_letter}
                  </p>
                </Card>
              </BlurFadeIn>
            )}
          </motion.div>
        )}

        {showFinalResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <AnalysisResultView
              result={result}
              reportId={status?.report_id ?? null}
              onResultChange={setResultOverride}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {pollError && (
        <Alert variant="destructive">
          <AlertTitle>Connection error</AlertTitle>
          <AlertDescription>{pollError}</AlertDescription>
        </Alert>
      )}

      {status?.state === "failed" && (
        <Alert variant="destructive">
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      )}

      {status?.state === "stopped" && (
        <Alert>
          <AlertTitle>Stopped early</AlertTitle>
          <AlertDescription>
            The analysis was stopped before finishing. Results below reflect whatever was completed
            before the stop.
          </AlertDescription>
        </Alert>
      )}

      {(status?.state === "completed" || status?.state === "stopped") && result && !result.eligibility.eligible && (
        <Alert variant="destructive">
          <AlertTitle>Not eligible for this role</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              Oops — this one&apos;s not quite a match yet. That&apos;s okay, it just means this specific
              posting may not be the best fit right now:
            </p>
            <ul className="list-disc pl-4">
              {result.eligibility.reasons.map((r) => {
                const lower = r.toLowerCase();
                if (lower.includes("experience")) {
                  return (
                    <li key={r}>
                      This role asks for{" "}
                      <span className="font-medium tabular-nums">{result.jd_experience_years}+</span> years of
                      experience — we found{" "}
                      <span className="font-medium tabular-nums">{result.resume_experience_years}</span> on your
                      resume.
                    </li>
                  );
                }
                if (lower.includes("degree")) {
                  return (
                    <li key={r}>
                      This role requires at least a{" "}
                      <span className="font-medium capitalize">{result.jd_degree.highest ?? "listed"}</span>{" "}
                      degree — your resume shows{" "}
                      <span className="font-medium capitalize">
                        {result.resume_degree.highest ?? "no degree detected"}
                      </span>
                      .
                    </li>
                  );
                }
                return <li key={r}>{r}</li>;
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}

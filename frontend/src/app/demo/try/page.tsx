"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScoreRing } from "@/components/app/score-ring";
import { StageProgressList } from "@/components/app/stage-progress";
import { ActivityTicker } from "@/components/app/activity-ticker";
import { EligibilitySnapshot } from "@/components/app/eligibility-snapshot";
import { LiveRequirementChecklist } from "@/components/app/live-requirement-checklist";
import { AnalysisResultView } from "@/components/app/analysis-result-view";
import { BlurFadeIn } from "@/components/motion/reveal";
import { GRADIENT_CTA } from "@/lib/category-theme";
import { createGuestJob, getJobSeekerJob } from "@/lib/api";
import { useJobPolling } from "@/lib/use-job-polling";
import { computeProvisionalScore } from "@/lib/scoring";
import { SAMPLE_SETS } from "@/lib/sample-sets";
import { cn } from "@/lib/utils";
import type { JobSeekerAnalysisResponse } from "@/lib/types";

// Public, no-login page -- not in proxy.ts's PROTECTED_ROUTES. Runs the
// REAL analysis pipeline (real LLM calls, live stage progress, the same
// components a signed-in user sees), but only ever on the 4 fixed sample
// roles: createGuestJob sends just a role key, and the backend's
// GUEST_SAMPLES owns the actual resume/JD text server-side -- a guest can
// never point this at arbitrary input. Nothing is saved (no resume/report
// row, no reportId), and it's rate-limited (see enforce_guest_rate_limit in
// the backend) since there's no account acting as a natural throttle.
export default function GuestTryPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { status, pollError } = useJobPolling(jobId, getJobSeekerJob);

  async function handleRun(role: string) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const id = await createGuestJob(role);
      setSelectedRole(role);
      setJobId(id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to start the guest demo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setJobId(null);
    setSelectedRole(null);
    setSubmitError(null);
  }

  const result = status?.result as JobSeekerAnalysisResponse | null;
  const jdRequirements = status?.partial.jd_requirements ?? [];
  const isRunning = jobId && status && status.state !== "completed" && status.state !== "failed";
  const showFinalResult =
    jobId && status?.state === "completed" && result && result.eligibility.eligible;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/demo" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Sample Report
        </Link>
        {jobId && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Try another sample
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wand2 className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Guest Demo</h1>
          <p className="text-sm text-muted-foreground">
            A real, live analysis run -- no account needed, using one of our sample role pairs.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!jobId && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <Card className="flex flex-col gap-4 p-6">
              <p className="text-sm text-muted-foreground">
                Pick a role to run the real pipeline live -- retrieval, evidence-grounded scoring, all of it.
                Guest runs are limited (a couple per visitor, a shared daily cap for everyone) since this path
                needs no sign-up at all.
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SETS.map((s) => (
                  <Button
                    key={s.role}
                    variant="outline"
                    className="gap-2"
                    disabled={submitting}
                    onClick={() => handleRun(s.role)}
                  >
                    <Sparkles className="size-3.5" />
                    {s.role}
                  </Button>
                ))}
              </div>
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Want to use your own resume and job description instead?{" "}
                <Link href="/job-seeker" className="text-primary underline underline-offset-4">
                  Sign up -- it&apos;s free
                </Link>
                .
              </p>
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
              <h2 className="text-sm font-medium text-muted-foreground">
                Analyzing the {selectedRole} sample&hellip;
              </h2>
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
          </motion.div>
        )}

        {showFinalResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <Alert className="mb-6">
              <Sparkles className="size-4" />
              <AlertTitle>This was a real, live analysis</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <p>Every score and citation below just came from the real pipeline, on the sample data above.</p>
                <Link
                  href="/job-seeker"
                  className={cn(
                    "inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5",
                    GRADIENT_CTA
                  )}
                >
                  Try it on your own resume
                  <ArrowRight className="size-3.5" />
                </Link>
              </AlertDescription>
            </Alert>
            <AnalysisResultView result={result} />
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

      {status?.state === "completed" && result && !result.eligibility.eligible && (
        <Alert variant="destructive">
          <AlertTitle>Not eligible for this role</AlertTitle>
          <AlertDescription>
            This sample resume doesn&apos;t clear this sample role&apos;s eligibility bar ({result.eligibility.reasons.join(", ")}
            ) -- pick a different sample above, or try it on your own resume once signed up.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}

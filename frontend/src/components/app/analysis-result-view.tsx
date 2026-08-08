"use client";

import { useState } from "react";
import { LayoutDashboard, ListChecks, FileText, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/app/score-ring";
import { RequirementBarChart } from "@/components/app/requirement-bar-chart";
import { RequirementVerdictList } from "@/components/app/requirement-verdict-card";
import { OptimizedResumeView } from "@/components/app/optimized-resume-view";
import { generateCoverLetter, generateOptimizedResume } from "@/lib/api";
import { CATEGORY_THEME, GRADIENT_CTA } from "@/lib/category-theme";
import { cn } from "@/lib/utils";
import type { JobSeekerAnalysisResponse } from "@/lib/types";

function GeneratePrompt({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onGenerate,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  onGenerate: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await onGenerate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-balance text-sm text-muted-foreground">{description}</p>
      {error && (
        <Alert variant="destructive" className="text-left">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button onClick={handleClick} disabled={loading} className={cn("mt-1 gap-2", GRADIENT_CTA)}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
        {loading ? "Generating..." : buttonLabel}
      </Button>
    </Card>
  );
}

export function AnalysisResultView({
  result,
  reportId,
  onResultChange,
}: {
  result: JobSeekerAnalysisResponse;
  reportId?: string | null;
  onResultChange?: (updated: JobSeekerAnalysisResponse) => void;
}) {
  return (
    <Tabs defaultValue="overview" className="gap-6">
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger
          value="overview"
          className={cn("gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5", CATEGORY_THEME.overview.tab)}
        >
          <LayoutDashboard className="size-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="breakdown"
          className={cn("gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5", CATEGORY_THEME.breakdown.tab)}
        >
          <ListChecks className="size-3.5" />
          Requirement Breakdown
        </TabsTrigger>
        <TabsTrigger
          value="cover-letter"
          className={cn(
            "gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5",
            CATEGORY_THEME.coverLetter.tab
          )}
        >
          <FileText className="size-3.5" />
          Cover Letter
        </TabsTrigger>
        <TabsTrigger
          value="improvements"
          className={cn(
            "gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5",
            CATEGORY_THEME.improvements.tab
          )}
        >
          <Sparkles className="size-3.5" />
          Optimized Resume
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="flex flex-col gap-6">
        <Card className="flex flex-wrap items-center justify-around gap-8 p-8">
          <ScoreRing label="Overall Fit" score={result.overall_fit_score} />
          <ScoreRing label="Skill-Based ATS Score" score={result.skill_based_ats_score} />
        </Card>
        <Card className={cn("flex flex-col gap-4 p-6", CATEGORY_THEME.overview.card)}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">At a glance</h2>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {result.matched_requirements.length} matched
              </Badge>
              <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
                {result.missing_requirements.length} missing
              </Badge>
            </div>
          </div>
          <RequirementBarChart verdicts={result.requirement_verdicts} />
          <p className="text-xs text-muted-foreground">
            See the Requirement Breakdown tab for the evidence behind every match, the Cover Letter
            tab for a tailored draft, and Optimized Resume for a polished, downloadable version.
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="breakdown">
        <Card className={cn("flex flex-col gap-4 p-6", CATEGORY_THEME.breakdown.card)}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Requirement Breakdown</h2>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {result.matched_requirements.length} matched
              </Badge>
              <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
                {result.missing_requirements.length} missing
              </Badge>
            </div>
          </div>
          <RequirementVerdictList verdicts={result.requirement_verdicts} />
        </Card>
      </TabsContent>

      <TabsContent value="cover-letter">
        {result.cover_letter ? (
          <Card className={cn("flex flex-col gap-3 p-6", CATEGORY_THEME.coverLetter.card)}>
            <h2 className="text-lg font-semibold text-foreground">Tailored Cover Letter</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{result.cover_letter}</p>
          </Card>
        ) : reportId && onResultChange ? (
          <GeneratePrompt
            icon={FileText}
            title="No cover letter yet"
            description="Generate a cover letter tailored to this specific resume and job description -- only runs when you ask for it."
            buttonLabel="Generate Cover Letter"
            onGenerate={async () => onResultChange(await generateCoverLetter(reportId))}
          />
        ) : null}
      </TabsContent>

      <TabsContent value="improvements">
        {result.optimized_resume ? (
          <OptimizedResumeView resume={result.optimized_resume} />
        ) : reportId && onResultChange ? (
          <GeneratePrompt
            icon={Sparkles}
            title="No optimized resume yet"
            description="Generate an ATS-tailored rewrite of your resume, checked afterward to make sure it never invents a skill or claim you don't actually have."
            buttonLabel="Generate Optimized Resume"
            onGenerate={async () => onResultChange(await generateOptimizedResume(reportId))}
          />
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

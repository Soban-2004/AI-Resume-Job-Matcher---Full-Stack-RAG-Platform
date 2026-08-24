import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, Sparkles, Wand2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnalysisResultView } from "@/components/app/analysis-result-view";
import { GRADIENT_CTA } from "@/lib/category-theme";
import { DEMO_JOB_ROLE, DEMO_REPORT } from "@/lib/demo-report";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sample Report -- AI Resume & Job Matcher",
};

// Public, no-login page -- not in proxy.ts's PROTECTED_ROUTES. Renders a
// hand-written static result through the real AnalysisResultView component,
// so it's a faithful preview with zero backend calls: nothing to fail,
// nothing to wait on, no LLM spend from anonymous traffic.
export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Home
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sample Report</h1>
          <p className="text-sm text-muted-foreground">A worked example for a {DEMO_JOB_ROLE} application.</p>
        </div>
      </div>

      <Alert>
        <Sparkles className="size-4" />
        <AlertTitle>This is a static example, not a live analysis</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>
            Every score, citation, and piece of generated text below is fixed sample data -- it exists to show
            what a real report looks like, without needing an account or a real resume.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/demo/try"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <Wand2 className="size-3.5" />
              Run a real analysis on sample data -- no account needed
            </Link>
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
          </div>
        </AlertDescription>
      </Alert>

      <AnalysisResultView result={DEMO_REPORT} />
    </main>
  );
}

import type { CandidateResult } from "@/lib/types";

interface FunnelStage {
  label: string;
  count: number;
  barClass: string;
}

/** A project-level funnel, distinct from PipelineViz (which shows one
 * candidate's own path). This shows the whole pool's drop-off across the
 * three-round screen. Ordered stages get an ordinal ramp -- one hue
 * (violet, the app's primary accent), light-to-dark as the pool narrows --
 * rather than unrelated categorical hues per stage. */
export function FunnelViz({ candidates }: { candidates: CandidateResult[] }) {
  const total = candidates.length;
  if (total === 0) return null;

  const eligible = candidates.filter((c) => c.eligible).length;
  const passedRound1 = candidates.filter((c) => c.eligible && c.round_reached >= 2).length;
  const fullyReviewed = candidates.filter((c) => c.eligible && c.round_reached >= 3).length;

  const stages: FunnelStage[] = [
    { label: "Uploaded", count: total, barClass: "bg-violet-300/40 dark:bg-violet-400/25" },
    { label: "Eligible · entered Round 1", count: eligible, barClass: "bg-violet-400/55 dark:bg-violet-400/45" },
    { label: "Passed Round 1 · entered Round 2", count: passedRound1, barClass: "bg-violet-500/70 dark:bg-violet-500/65" },
    { label: "Passed Round 2 · fully reviewed", count: fullyReviewed, barClass: "bg-violet-600/85 dark:bg-violet-400/85" },
  ];

  return (
    // Each stage's label/count/percentage below is real text, not baked into
    // an image or canvas -- that's the accessible "table view" here, so no
    // separate hidden data table or aria-label summary is needed on top.
    <div className="flex flex-col gap-3">
      {stages.map((stage, i) => {
        const widthPercent = total > 0 ? (stage.count / total) * 100 : 0;
        const previous = i > 0 ? stages[i - 1].count : null;
        const conversionPercent = previous && previous > 0 ? Math.round((stage.count / previous) * 100) : null;

        return (
          <div key={stage.label} className="group flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
              <span className="font-medium text-foreground">{stage.label}</span>
              <span className="flex items-baseline gap-1.5 text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{stage.count}</span>
                <span className="tabular-nums">({Math.round(widthPercent)}%)</span>
                {conversionPercent !== null && (
                  <span className="tabular-nums opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    &middot; {conversionPercent}% of previous stage
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-muted/40">
              <div
                className={`h-full rounded-md transition-[width] duration-500 ${stage.barClass}`}
                style={{ width: `${Math.max(widthPercent, stage.count > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

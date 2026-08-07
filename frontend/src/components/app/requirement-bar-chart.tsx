import { cn } from "@/lib/utils";
import type { RequirementVerdict } from "@/lib/types";

/** A weight-sorted, at-a-glance view of every requirement -- the accordion
 * list in the Breakdown tab is for reading evidence one item at a time; this
 * is for seeing the whole shape of the match in one look (which high-weight
 * items are missing, at a glance, without scrolling 24 accordion rows). */
export function RequirementBarChart({ verdicts }: { verdicts: RequirementVerdict[] }) {
  if (verdicts.length === 0) return null;
  const sorted = [...verdicts].sort((a, b) => b.weight - a.weight);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500/70" />
          Matched
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-400/60" />
          Missing
        </span>
        <span className="ml-auto">Bar length = importance weight</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {sorted.map((v) => (
          <div key={v.requirement} className="group flex items-center gap-3">
            <span
              className="w-24 shrink-0 truncate text-xs font-medium capitalize text-foreground sm:w-36"
              title={v.requirement}
            >
              {v.requirement}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-muted/40">
              <div
                className={cn(
                  "h-full rounded transition-[width] duration-500",
                  v.satisfied ? "bg-emerald-500/70" : "bg-red-400/50"
                )}
                style={{ width: `${Math.max(v.weight * 100, 3)}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-[0.65rem] text-muted-foreground opacity-0 transition-opacity duration-150 tabular-nums group-hover:opacity-100">
              weight {v.weight.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

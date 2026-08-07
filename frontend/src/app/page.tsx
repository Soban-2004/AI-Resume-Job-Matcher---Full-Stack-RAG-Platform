import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Users,
  UploadCloud,
  SearchCode,
  ShieldCheck,
  ListChecks,
  Quote,
  Layers,
  RadioTower,
  FileCheck2,
  KanbanSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LivePreviewPanel } from "@/components/app/live-preview-panel";
import { GRADIENT_CTA, GRADIENT_TEXT } from "@/lib/category-theme";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  "Hybrid BM25 + Dense Retrieval",
  "Evidence-Cited, Never a Black Box",
  "3-Tier LLM Fallback",
  "Cross-Encoder Reranked",
];

const HOW_IT_WORKS = [
  {
    icon: UploadCloud,
    title: "1. Upload your resume and the job description",
    body: "That's it to start — no account required just to see a preview. Job seekers get one resume vs. one JD; recruiters can drop in a whole batch of candidates against one posting.",
  },
  {
    icon: SearchCode,
    title: "2. We search for evidence, not keywords",
    body: "Your resume is split into overlapping chunks and searched two ways at once: dense (semantic meaning) and BM25 (exact terms), fused together, then re-scored by a cross-encoder that actually reads the requirement and the resume snippet side by side.",
  },
  {
    icon: ShieldCheck,
    title: "3. The AI has to point to a real sentence",
    body: "A requirement is never marked \"satisfied\" on vibes. The model is shown only the top retrieved snippets and told to quote one — if there's no evidence, it says so, instead of guessing to be agreeable.",
  },
  {
    icon: ListChecks,
    title: "4. You get a real breakdown, not just a score",
    body: "Every requirement, matched or missing, with the exact evidence behind it. Job seekers also get a tailored cover letter and a rewritten resume that's checked afterward to make sure it never invents a skill you don't have.",
  },
];

const COMPARISON = [
  {
    label: "Matching approach",
    old: "Counts keyword overlap — misses paraphrases entirely",
    ours: "Hybrid semantic + keyword search, so \"built REST services\" matches a \"REST API\" requirement",
  },
  {
    label: "How a verdict is justified",
    old: "A single opaque score, no way to see why",
    ours: "Every match cites the exact resume sentence it's grounded in",
  },
  {
    label: "Cost on a big batch",
    old: "Either skips resumes or reviews all of them at full cost",
    ours: "A 3-round funnel escalates scrutiny only for survivors — full review on ~5% of a pool",
  },
  {
    label: "What happens on a provider outage",
    old: "The tool just breaks",
    ours: "A 3-tier LLM fallback chain quietly moves to the next provider",
  },
];

const STACK_GROUPS = [
  { label: "Frontend", items: ["Next.js 16", "TypeScript", "Tailwind"] },
  { label: "Backend", items: ["FastAPI", "SQLAlchemy", "PostgreSQL"] },
  { label: "AI & Retrieval", items: ["Qdrant", "Cohere", "BM25", "Groq", "Gemini", "Ollama"] },
  { label: "Infra & Auth", items: ["Supabase", "Vercel", "Render"] },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-6 py-20">
      {/* Hero */}
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Find the resume that <span className={GRADIENT_TEXT}>actually fits.</span>
          </h1>
          <p className="max-w-lg text-balance text-lg text-muted-foreground">
            Not the one with the most keywords. Every match is cited to the exact resume
            evidence that supports it.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/job-seeker"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5",
                GRADIENT_CTA
              )}
            >
              <Compass className="size-4" />
              Analyze my resume
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/recruiter"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-blue-500/40"
            >
              <Users className="size-4 text-blue-600 dark:text-blue-400" />
              Rank candidates
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {TRUST_BADGES.map((b) => (
              <Badge key={b} variant="secondary" className="font-normal text-muted-foreground">
                {b}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <LivePreviewPanel />
        </div>
      </div>

      {/* How it works */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">How it actually works</h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-muted-foreground">
            No jargon required to follow along — here&apos;s the whole pipeline in plain terms.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_IT_WORKS.map((step) => (
            <Card key={step.title} className="flex flex-col gap-3 rounded-[14px] p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Audience cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3 rounded-[14px] border-l-2 border-l-violet-500/50 p-6">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-semibold text-foreground">For Job Seekers</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Upload one resume against one job posting and get an evidence-backed fit score, a
            cited requirement-by-requirement breakdown, a tailored cover letter, and an
            AI-optimized resume rewrite — checked afterward so it never invents a skill or number
            you didn&apos;t actually have.
          </p>
        </Card>

        <Card className="flex flex-col gap-3 rounded-[14px] border-l-2 border-l-blue-500/50 p-6">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground">For Recruiters</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Create a reopenable hiring project, upload a batch of resumes against one JD, and
            watch a ranked shortlist build live. A three-round funnel means the expensive,
            fully-cited review only ever runs on the candidates who&apos;ve actually earned it — not
            all of them.
          </p>
        </Card>
      </section>

      {/* Comparison */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Why not just use a keyword scanner or ChatGPT?
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-muted-foreground">
            Both have real, specific failure modes this platform was built to avoid.
          </p>
        </div>
        <Card className="overflow-x-auto rounded-[14px] p-0">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">&nbsp;</th>
                <th className="px-5 py-3 font-medium">Typical ATS / keyword tool</th>
                <th className="px-5 py-3 font-medium">This platform</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.label} className={i !== COMPARISON.length - 1 ? "border-b border-border/60" : ""}>
                  <td className="px-5 py-4 align-top text-xs font-medium text-muted-foreground">{row.label}</td>
                  <td className="px-5 py-4 align-top text-foreground/70">{row.old}</td>
                  <td className="px-5 py-4 align-top text-foreground">{row.ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Under the hood */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Built with real engineering</h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-muted-foreground">
            A full client/server application, not a single script — here&apos;s what&apos;s actually running
            underneath.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STACK_GROUPS.map((group) => (
            <Card key={group.label} className="flex flex-col gap-3 rounded-[14px] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <Badge key={item} variant="secondary" className="font-normal">
                    {item}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="flex flex-col items-center gap-2 rounded-[14px] p-5 text-center">
            <Layers className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Hybrid retrieval</span> fuses dense +
              BM25 search via reciprocal rank fusion
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-2 rounded-[14px] p-5 text-center">
            <RadioTower className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">3-tier LLM fallback</span> keeps
              scoring working through a provider&apos;s rate limit
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-2 rounded-[14px] p-5 text-center">
            <FileCheck2 className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Fabrication guardrail</span> verifies
              every AI-optimized resume never invents a claim
            </p>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <Card className="flex flex-col items-center gap-4 rounded-[14px] p-10 text-center">
          <KanbanSquare className="size-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Try it on your own resume or job posting</h2>
          <p className="max-w-md text-balance text-sm text-muted-foreground">
            <Quote className="mr-1 inline size-3.5 -translate-y-px text-muted-foreground/60" />
            Every result you get back is grounded in something real — not a guess dressed up as a
            score.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/job-seeker"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5",
                GRADIENT_CTA
              )}
            >
              <Compass className="size-4" />
              Analyze my resume
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/recruiter"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-blue-500/40"
            >
              <Users className="size-4 text-blue-600 dark:text-blue-400" />
              Rank candidates
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}

import type { JdRequirement, RequirementVerdict } from "./types";

/** Client-side approximation of the real skill-based ATS score, computed
 * live from whatever verdicts have streamed in so far -- shown as a
 * "provisional" score while a job is still running, before the backend's
 * final (confidence-weighted) score is available. Used by both the
 * authenticated job-seeker flow and the guest-demo flow. */
export function computeProvisionalScore(jdRequirements: JdRequirement[], verdicts: RequirementVerdict[]): number {
  const totalWeight = jdRequirements.reduce((sum, r) => sum + r.weight, 0);
  if (totalWeight === 0) return 0;
  const satisfiedWeight = verdicts.filter((v) => v.satisfied).reduce((sum, v) => sum + v.weight, 0);
  return (satisfiedWeight / totalWeight) * 100;
}

import type { PlanKey } from "@/lib/entitlements/domain";
import {
  membershipPlanFor,
  tarotJournalIncluded,
} from "@/lib/membership/plans";
import type { TarotAccessDecision } from "@/lib/tarot/types";

/**
 * Two levels only: Free and Atlas (`premium`). The retired `personal` key
 * never unlocks anything as a current plan, and as a stored minimum it is
 * treated as Atlas so nothing becomes free by accident.
 */
const TIER_RANK = { free: 0, atlas: 1 } as const;

function requiredTier(minimumPlan: PlanKey) {
  return minimumPlan === "free" ? TIER_RANK.free : TIER_RANK.atlas;
}

export function planMeetsTarotMinimum(
  currentPlan: PlanKey,
  minimumPlan: PlanKey,
) {
  return TIER_RANK[membershipPlanFor(currentPlan)] >= requiredTier(minimumPlan);
}

/** Saving draws to the private tarot journal is an Atlas feature. */
export function tarotJournalAvailable(currentPlan: PlanKey) {
  return tarotJournalIncluded(currentPlan);
}

export function decideTarotAccess(input: {
  currentPlan: PlanKey;
  deckMinimumPlan: PlanKey;
  spreadMinimumPlan: PlanKey;
}): TarotAccessDecision {
  if (!planMeetsTarotMinimum(input.currentPlan, input.deckMinimumPlan)) {
    return {
      allowed: false,
      reason: "deck_locked",
      minimumPlan: input.deckMinimumPlan,
    };
  }
  if (!planMeetsTarotMinimum(input.currentPlan, input.spreadMinimumPlan)) {
    return {
      allowed: false,
      reason: "spread_locked",
      minimumPlan: input.spreadMinimumPlan,
    };
  }
  return { allowed: true };
}

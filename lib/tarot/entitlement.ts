import type { PlanKey } from "@/lib/entitlements/domain";
import type { TarotAccessDecision } from "@/lib/tarot/types";

const PLAN_RANK: Record<PlanKey, number> = {
  free: 0,
  personal: 1,
  premium: 2,
};

export function planMeetsTarotMinimum(
  currentPlan: PlanKey,
  minimumPlan: PlanKey,
) {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[minimumPlan];
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

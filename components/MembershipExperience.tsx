"use client";

import "@/app/styles/atlas-membership.css";

import Link from "next/link";
import { useState } from "react";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { useLocale } from "@/components/LocaleProvider";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { fillMembershipCopy, membershipCopy } from "@/lib/membership/content";
import {
  ATLAS_PRICES,
  ATLAS_YEARLY_SAVING_PERCENT,
  BILLING_INTERVALS,
  type BillingInterval,
  type MembershipPlanId,
  type SubscriptionProvider,
} from "@/lib/membership/plans";

const yearlyMonthlyEquivalent = `$${(ATLAS_PRICES.year.unitAmount / 12 / 100).toFixed(2)}`;

export function MembershipExperience({
  signedIn,
  subscriptionsEnabled,
  availableIntervals,
  planId,
  provider,
  trialEligible,
}: {
  signedIn: boolean;
  subscriptionsEnabled: boolean;
  /** Intervals with an active Stripe price; empty until the operator activates them. */
  availableIntervals: BillingInterval[];
  planId: MembershipPlanId;
  /** Billing provider of the current subscription, if any. */
  provider: SubscriptionProvider | null;
  trialEligible: boolean;
}) {
  const { locale } = useLocale();
  const copy = membershipCopy[locale].page;
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const free = copy.tiers.free;
  const atlas = copy.tiers.atlas;
  const isAtlasMember = signedIn && planId === "atlas";
  const atlasOnSale =
    subscriptionsEnabled && availableIntervals.includes(interval);
  const atlasLabel = trialEligible ? copy.startTrial : copy.upgrade;

  function freeAction() {
    if (!signedIn)
      return (
        <Link
          href="/auth/create-account"
          className="atlas-button-ghost atlas-membership__cta"
        >
          {free.action}
        </Link>
      );
    if (planId === "free")
      return (
        <p className="atlas-membership__current" aria-current="true">
          {copy.currentPlan}
        </p>
      );
    return (
      <Link
        href="/account"
        className="atlas-button-ghost atlas-membership__cta"
      >
        {copy.openAccount}
      </Link>
    );
  }

  function atlasAction() {
    if (isAtlasMember)
      return provider ? (
        <BillingPortalButton
          provider={provider}
          label={copy.manage}
          className="atlas-button atlas-button--hero atlas-membership__cta"
        />
      ) : (
        <p className="atlas-membership__current" aria-current="true">
          {copy.currentPlan}
        </p>
      );
    if (!atlasOnSale)
      return (
        <>
          <button
            type="button"
            className="atlas-button atlas-button--hero atlas-membership__cta"
            disabled
          >
            {atlasLabel}
          </button>
          <p className="atlas-membership__note">{copy.unavailable}</p>
        </>
      );
    if (!signedIn)
      return (
        <Link
          href="/auth/create-account"
          className="atlas-button atlas-button--hero atlas-membership__cta"
        >
          {atlasLabel}
        </Link>
      );
    return (
      <SubscriptionButton
        interval={interval}
        label={atlasLabel}
        className="atlas-button atlas-button--hero atlas-membership__cta"
      />
    );
  }

  const atlasPrice = ATLAS_PRICES[interval].display;
  const atlasCadence =
    interval === "month"
      ? copy.interval.monthCadence
      : copy.interval.yearCadence;

  return (
    <main className="atlas-shell atlas-membership">
      <header className="atlas-membership__intro">
        <p className="atlas-kicker">{copy.kicker}</p>
        <h1 className="atlas-page-title">{copy.title}</h1>
        <p className="atlas-membership__lede">{copy.introduction}</p>
      </header>

      <section className="atlas-membership__tiers" aria-label={copy.tiersLabel}>
        <article
          className="atlas-membership__tier"
          aria-labelledby="membership-free"
        >
          <div className="atlas-membership__heading">
            <h2 id="membership-free">{free.name}</h2>
            <span className="atlas-membership__badge">{free.badge}</span>
          </div>
          <p className="atlas-membership__price">
            <span>{free.price}</span>
            <small>{free.cadence}</small>
          </p>
          <p className="atlas-membership__rhythm">{free.rhythm}</p>
          <ul className="atlas-membership__features">
            {free.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          {freeAction()}
        </article>

        <article
          className="atlas-membership__tier atlas-membership__tier--atlas"
          aria-labelledby="membership-atlas"
        >
          <div className="atlas-membership__heading">
            <h2 id="membership-atlas">{atlas.name}</h2>
            <span className="atlas-membership__badge">{atlas.badge}</span>
          </div>
          {!isAtlasMember && (
            <div
              className="atlas-membership__interval"
              role="group"
              aria-label={copy.interval.label}
            >
              {BILLING_INTERVALS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="atlas-chip"
                  aria-pressed={interval === option}
                  onClick={() => setBillingInterval(option)}
                >
                  {copy.interval[option]}
                  {option === "year" && (
                    <span className="atlas-membership__saving">
                      {fillMembershipCopy(copy.interval.yearlySaving, {
                        percent: ATLAS_YEARLY_SAVING_PERCENT,
                      })}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <p className="atlas-membership__price" aria-live="polite">
            <span>{atlasPrice}</span>
            <small>{isAtlasMember ? atlas.cadence : atlasCadence}</small>
          </p>
          {!isAtlasMember && interval === "year" && (
            <p className="atlas-membership__equivalent">
              {fillMembershipCopy(copy.interval.yearlyEquivalent, {
                price: yearlyMonthlyEquivalent,
              })}
            </p>
          )}
          <p className="atlas-membership__rhythm">{atlas.rhythm}</p>
          <ul className="atlas-membership__features">
            {atlas.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          {atlasAction()}
        </article>
      </section>

      <p className="atlas-membership__footnote">{copy.footnote}</p>
    </main>
  );
}

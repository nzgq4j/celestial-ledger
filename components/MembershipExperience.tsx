"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import {
  membershipCopy,
  type MembershipTierId,
} from "@/lib/membership/content";
import { SubscriptionButton } from "@/components/SubscriptionButton";

const tierIds: MembershipTierId[] = ["free", "personal", "premium"];

export function MembershipExperience({
  signedIn,
  subscriptionsEnabled,
}: {
  signedIn: boolean;
  subscriptionsEnabled: boolean;
}) {
  const { locale } = useLocale();
  const copy = membershipCopy[locale].page;
  const accountPath = signedIn ? "/account" : "/auth/login";
  return (
    <main className="page-shell membership-page">
      <header className="membership-hero">
        <div className="membership-hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.introduction}</p>
          <div className="membership-hero__actions">
            <Link href={accountPath} className="button-primary">
              {signedIn ? copy.signedInAction : copy.pathAction}
            </Link>
            <Link href="/samples" className="button-quiet">
              {copy.reportsAction}
            </Link>
          </div>
          <p className="membership-preview-note">
            {subscriptionsEnabled ? copy.preview : copy.unavailable}
          </p>
        </div>
        <figure className="membership-orbits" aria-label={copy.orbitLabel}>
          <div className="membership-orbits__ring membership-orbits__ring--premium">
            <span>{copy.tiers.premium.name}</span>
          </div>
          <div className="membership-orbits__ring membership-orbits__ring--personal">
            <span>{copy.tiers.personal.name}</span>
          </div>
          <div className="membership-orbits__ring membership-orbits__ring--free">
            <span>{copy.tiers.free.name}</span>
          </div>
          <i aria-hidden="true" />
        </figure>
      </header>

      <section className="membership-tiers" aria-label={copy.orbitLabel}>
        {tierIds.map((tierId, index) => {
          const tier = copy.tiers[tierId];
          return (
            <article
              key={tierId}
              className={`membership-tier membership-tier--${tierId}`}
            >
              <div className="membership-tier__orbit" aria-hidden="true">
                <span>{index + 1}</span>
              </div>
              <div className="membership-tier__identity">
                <p className="section-kicker">{tier.descriptor}</p>
                <h2>{tier.name}</h2>
                <p>{tier.purpose}</p>
              </div>
              <div className="membership-tier__price">
                {tierId === "personal" && <span>{copy.recommended}</span>}
                <strong>{tier.price}</strong>
                <small>{tier.cadence}</small>
              </div>
              <div className="membership-tier__features">
                <p>{copy.included}</p>
                <ul>
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              {subscriptionsEnabled && signedIn && tierId !== "free" ? (
                <SubscriptionButton planKey={tierId} />
              ) : (
                <Link
                  href={accountPath}
                  className={
                    tierId === "personal" ? "button-primary" : "button-quiet"
                  }
                >
                  {signedIn ? copy.signedInAction : tier.action}
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <section
        className="membership-comparison"
        aria-labelledby="membership-comparison-title"
      >
        <header>
          <p className="section-kicker">{copy.comparisonKicker}</p>
          <h2 id="membership-comparison-title">{copy.comparisonTitle}</h2>
          <p>{copy.comparisonIntroduction}</p>
        </header>
        <div className="membership-comparison__scroll">
          <table>
            <thead>
              <tr>
                <th>{copy.feature}</th>
                <th>{copy.tiers.free.name}</th>
                <th>{copy.tiers.personal.name}</th>
                <th>{copy.tiers.premium.name}</th>
              </tr>
            </thead>
            <tbody>
              {copy.comparison.map((row) => (
                <tr key={row.feature}>
                  <th>{row.feature}</th>
                  <td>{row.free}</td>
                  <td>{row.personal}</td>
                  <td>{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="membership-path"
        aria-labelledby="membership-path-title"
      >
        <header>
          <p className="section-kicker">{copy.pathKicker}</p>
          <h2 id="membership-path-title">{copy.pathTitle}</h2>
        </header>
        <ol>
          {copy.path.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href={accountPath} className="button-primary">
          {signedIn ? copy.signedInAction : copy.pathAction}
        </Link>
      </section>
    </main>
  );
}

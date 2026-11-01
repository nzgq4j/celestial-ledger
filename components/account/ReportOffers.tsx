import Link from "next/link";
import type { ReactNode } from "react";
import type { LocaleTag, TranslationPack } from "@/lib/i18n/config";
import { memberCopy, fillCopy } from "@/lib/account/member-copy";
import {
  accountReportTypes,
  type AccountReportState,
  type AccountReportType,
} from "@/lib/account/report-states";
import { formatPrice } from "@/lib/account/member-data";
import { isAtlasMember, PLAN_ALLOWANCES } from "@/lib/membership/plans";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { CheckoutButton } from "@/components/CheckoutButton";

const samplePaths: Record<AccountReportType, string> = {
  career_purpose: "/samples/career-purpose",
  recovery_reflection: "/samples/recovery-reflection",
};

type Price = { report_type: string; unit_amount: number; currency: string };

export type ReportOffersProps = {
  pack: TranslationPack;
  /** Report states for a signed-in member; omit for visitors. */
  member?: {
    states: AccountReportState[];
    primaryReportType?: AccountReportType;
    planKey: string;
    profiles: Array<{ id: string; label: string }>;
    reportLocale: LocaleTag;
    checkoutEnabled: boolean;
    availableReportCredits: number;
  };
  prices: Price[];
};

/**
 * The report cards from the "Reports" screen. For members each card carries
 * the live state of that report (purchased, included, saved, for sale) and
 * the matching action; visitors see the catalogue with a sign-up action.
 */
export function ReportOffers({ pack, member, prices }: ReportOffersProps) {
  const locale = pack.tag;
  const m = memberCopy[locale];
  const accountCopy = pack.messages.account;
  const atlas = member ? isAtlasMember(member.planKey) : false;
  const atlasDiscount = PLAN_ALLOWANCES.atlas.reportDiscountPercent;
  const reportTypes: AccountReportType[] = member
    ? member.states
        .map((state) => state.product.report_type as AccountReportType)
        .filter((type) => accountReportTypes.includes(type))
    : [...accountReportTypes];

  return (
    <div className="report-offers">
      {reportTypes.map((reportType) => {
        const state = member?.states.find(
          (candidate) => candidate.product.report_type === reportType,
        );
        const isRecovery = reportType === "recovery_reflection";
        const priceLabel = formatPrice(
          prices.find((candidate) => candidate.report_type === reportType),
          locale,
        );
        const emphasis =
          member?.primaryReportType === reportType ? "primary" : "secondary";
        const savedReport =
          state && "report" in state ? state.report : undefined;
        const entitlement =
          state && "entitlement" in state ? state.entitlement : undefined;
        // An included report (Atlas: one per membership year) is redeemed
        // through CheckoutButton's credit action.
        const included = Boolean(state && state.kind.includes("included"));
        const discount =
          state && "discountPercent" in state ? state.discountPercent : 0;
        const status = savedReport
          ? { label: m.statusInLibrary, tone: "cyan" }
          : entitlement
            ? { label: m.statusPurchased, tone: "cyan" }
            : included
              ? { label: m.statusIncluded, tone: "gold" }
              : discount > 0
                ? {
                    label: fillCopy(m.statusAtlasDiscount, {
                      percent: discount,
                    }),
                    tone: "gold",
                  }
                : priceLabel
                  ? { label: priceLabel, tone: "muted" }
                  : member && !member.checkoutEnabled
                    ? { label: m.statusAvailable, tone: "muted" }
                    : member
                      ? { label: m.statusUnavailable, tone: "muted" }
                      : undefined;
        const meta = [
          m.reportMeta,
          !atlas && atlasDiscount
            ? fillCopy(m.atlasSaves, { percent: atlasDiscount })
            : "",
        ]
          .filter(Boolean)
          .join(" · ");
        const titleId = `report-offer-${reportType}`;

        let action: ReactNode;
        if (!member)
          action = (
            <Link href="/auth/create-account" className="atlas-button">
              {m.getStarted}
            </Link>
          );
        else if (savedReport)
          action = (
            <Link
              href={
                savedReport.status === "completed"
                  ? `/reports/${savedReport.id}`
                  : `/account?view=library&focusReport=${savedReport.id}`
              }
              className={
                emphasis === "primary" ? "atlas-button" : "atlas-button-ghost"
              }
            >
              {m.continueReport}
            </Link>
          );
        else if (!member.profiles.length)
          action = (
            <Link href="/#chart" className="atlas-button">
              {m.createChartFirst}
            </Link>
          );
        else if (entitlement || !member.checkoutEnabled)
          action = (
            <GenerateReportButton
              entitlementId={entitlement?.id}
              reportType={reportType}
              profiles={member.profiles}
              defaultLocale={member.reportLocale}
              emphasis={emphasis}
            />
          );
        else if (priceLabel || included)
          action = (
            <CheckoutButton
              reportType={reportType}
              priceLabel={priceLabel}
              creditAvailable={included || member.availableReportCredits > 0}
              emphasis={emphasis}
            />
          );
        else action = <strong>{accountCopy.currentlyUnavailable}</strong>;

        return (
          <article
            className="report-offer"
            key={reportType}
            aria-labelledby={titleId}
          >
            <div className="report-offer__top">
              <span className="atlas-kicker">{m.natalReportKicker}</span>
              {status && (
                <span className={`member-pill member-pill--${status.tone}`}>
                  {status.label}
                </span>
              )}
            </div>
            <h2 id={titleId} className="report-offer__title">
              {isRecovery
                ? accountCopy.recoveryReflection
                : accountCopy.careerPurpose}
            </h2>
            <p className="report-offer__copy">
              {isRecovery
                ? accountCopy.recoveryDescription
                : accountCopy.careerDescription}
            </p>
            <p className="report-offer__meta">{meta}</p>
            <div className="report-offer__actions">
              {action}
              <Link
                href={samplePaths[reportType]}
                className="atlas-button-ghost"
              >
                {m.readSample}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

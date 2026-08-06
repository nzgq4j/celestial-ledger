"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recoveryThemes, type RecoveryTheme } from "@/lib/reports/recovery";
import { careerThemes, type CareerTheme } from "@/lib/reports/career";
import { useLocale } from "@/components/LocaleProvider";
import { localeRegistry, localeTags, type LocaleTag } from "@/lib/i18n/config";

type Option = { id: string; label: string };
export function GenerateReportButton({
  entitlementId,
  profiles,
  reportType,
  defaultLocale,
}: {
  entitlementId?: string;
  profiles: Option[];
  reportType: string;
  defaultLocale: LocaleTag;
}) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [themes, setThemes] = useState<RecoveryTheme[]>([]);
  const [careerSelections, setCareerSelections] = useState<CareerTheme[]>([]);
  const [reportLocale, setReportLocale] = useState(defaultLocale);
  const [useDefaultLocale, setUseDefaultLocale] = useState(true);
  const isRecovery = reportType === "recovery_reflection";
  const isCareer = reportType === "career_purpose";
  const { pack } = useLocale();
  const copy = pack.messages.account;
  const themeCopy: Record<RecoveryTheme, [string, string]> = {
    grounding: [copy.grounding, copy.groundingDetail],
    relationships: [copy.relationships, copy.relationshipsDetail],
    self_trust: [copy.selfTrust, copy.selfTrustDetail],
    daily_rhythms: [copy.dailyRhythms, copy.dailyRhythmsDetail],
    boundaries: [copy.boundaries, copy.boundariesDetail],
    renewal: [copy.renewal, copy.renewalDetail],
  };
  const careerThemeCopy: Record<CareerTheme, [string, string]> = {
    direction_purpose: [copy.careerDirection, copy.careerDirectionDetail],
    strengths_talents: [copy.careerStrengths, copy.careerStrengthsDetail],
    leadership_visibility: [copy.careerLeadership, copy.careerLeadershipDetail],
    work_environment: [copy.careerEnvironment, copy.careerEnvironmentDetail],
    growth_change: [copy.careerGrowth, copy.careerGrowthDetail],
    value_compensation: [copy.careerValue, copy.careerValueDetail],
  };
  async function generate() {
    if (!profileId) return setStatus(copy.saveProfileFirst);
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(entitlementId ? { entitlementId } : { reportType }),
          birthProfileId: profileId,
          ...(!useDefaultLocale ? { locale: reportLocale } : {}),
          ...(isRecovery ? { adultConfirmed, recoveryThemes: themes } : {}),
          ...(isCareer ? { careerThemes: careerSelections } : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      router.push(`/account?focusReport=${payload.reportId}#reports`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.reportFailed);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="report-generator">
      <label
        className="label"
        htmlFor={`profile-${entitlementId ?? reportType}`}
      >
        {copy.useProfile}
      </label>
      <select
        id={`profile-${entitlementId ?? reportType}`}
        className="input"
        value={profileId}
        onChange={(event) => setProfileId(event.target.value)}
      >
        {profiles.length ? (
          profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))
        ) : (
          <option value="">{copy.noSavedProfiles}</option>
        )}
      </select>
      <label className="report-language-default">
        <input
          type="checkbox"
          checked={useDefaultLocale}
          onChange={(event) => setUseDefaultLocale(event.target.checked)}
        />
        <span>{copy.useSelectedLanguage}</span>
      </label>
      {!useDefaultLocale && (
        <div className="report-language-override">
          <label
            className="label"
            htmlFor={`locale-${entitlementId ?? reportType}`}
          >
            {copy.reportLanguage}
          </label>
          <select
            id={`locale-${entitlementId ?? reportType}`}
            className="input"
            value={reportLocale}
            onChange={(event) =>
              setReportLocale(event.target.value as LocaleTag)
            }
          >
            {localeTags.map((tag) => (
              <option key={tag} value={tag} lang={tag}>
                {localeRegistry[tag].nativeName}
              </option>
            ))}
          </select>
          <small className="report-language-hint">
            {copy.reportLanguageOverride}
          </small>
        </div>
      )}
      {isRecovery && (
        <fieldset className="recovery-compass">
          <legend>{copy.chooseThemes}</legend>
          <p>{copy.chooseThemesCopy}</p>
          <div className="recovery-compass__themes">
            {recoveryThemes.map((theme) => (
              <label key={theme.id}>
                <input
                  type="checkbox"
                  checked={themes.includes(theme.id)}
                  onChange={(event) =>
                    setThemes((current) =>
                      event.target.checked
                        ? [...current, theme.id]
                        : current.filter((item) => item !== theme.id),
                    )
                  }
                />
                <span>
                  <strong>{themeCopy[theme.id][0]}</strong>
                  <small>{themeCopy[theme.id][1]}</small>
                </span>
              </label>
            ))}
          </div>
          <label className="recovery-confirmation">
            <input
              type="checkbox"
              checked={adultConfirmed}
              onChange={(event) => setAdultConfirmed(event.target.checked)}
            />
            <span>{copy.adultConfirmation}</span>
          </label>
        </fieldset>
      )}
      {isCareer && (
        <fieldset className="recovery-compass career-compass">
          <legend>{copy.chooseCareerThemes}</legend>
          <p>{copy.chooseCareerThemesCopy}</p>
          <div className="recovery-compass__themes">
            {careerThemes.map((theme) => (
              <label key={theme.id}>
                <input
                  type="checkbox"
                  checked={careerSelections.includes(theme.id)}
                  onChange={(event) =>
                    setCareerSelections((current) =>
                      event.target.checked
                        ? [...current, theme.id]
                        : current.filter((item) => item !== theme.id),
                    )
                  }
                />
                <span>
                  <strong>{careerThemeCopy[theme.id][0]}</strong>
                  <small>{careerThemeCopy[theme.id][1]}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <button
        type="button"
        className="button-primary"
        disabled={
          busy ||
          !profiles.length ||
          (isCareer && careerSelections.length === 0) ||
          (isRecovery && (!adultConfirmed || themes.length === 0))
        }
        onClick={generate}
      >
        {busy ? copy.queueing : copy.generateReport}
      </button>
      {status && (
        <p role="status" className="text-sm text-[#d7bd7b]">
          {status}
        </p>
      )}
    </div>
  );
}

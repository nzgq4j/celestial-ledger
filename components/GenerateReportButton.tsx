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
  emphasis = "secondary",
}: {
  entitlementId?: string;
  profiles: Option[];
  reportType: string;
  defaultLocale: LocaleTag;
  emphasis?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
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
          ...(isRecovery ? { recoveryThemes: themes } : {}),
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
  const controlId = entitlementId ?? reportType;
  return (
    <details
      className={`report-generator report-generator--${emphasis}`}
      name="account-report-generator"
    >
      <summary
        className={
          emphasis === "primary" ? "button-primary" : "button-secondary"
        }
      >
        {copy.personaliseReport}
      </summary>
      <div className="report-generator__body">
        {profiles.length > 1 ? (
          <div className="report-generator__field">
            <label className="label" htmlFor={`profile-${controlId}`}>
              {copy.useProfile}
            </label>
            <select
              id={`profile-${controlId}`}
              className="input"
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>
        ) : profiles.length === 1 ? (
          <p className="report-generator__profile">
            <span>{copy.usingProfile}</span>
            <strong>{profiles[0].label}</strong>
          </p>
        ) : (
          <p className="report-generator__profile">
            <span>{copy.useProfile}</span>
            <strong>{copy.noSavedProfiles}</strong>
          </p>
        )}

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
            <label className="label" htmlFor={`locale-${controlId}`}>
              {copy.reportLanguage}
            </label>
            <select
              id={`locale-${controlId}`}
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
          <fieldset className="report-theme-selector">
            <legend>{copy.chooseThemes}</legend>
            <p>{copy.chooseThemesCopy}</p>
            <div className="report-theme-selector__chips">
              {recoveryThemes.map((theme) => {
                const detailId = `theme-${controlId}-${theme.id}`;
                return (
                  <label
                    className="report-theme-chip"
                    key={theme.id}
                    title={themeCopy[theme.id][1]}
                  >
                    <input
                      type="checkbox"
                      checked={themes.includes(theme.id)}
                      aria-describedby={detailId}
                      onChange={(event) =>
                        setThemes((current) =>
                          event.target.checked
                            ? [...current, theme.id]
                            : current.filter((item) => item !== theme.id),
                        )
                      }
                    />
                    <span>{themeCopy[theme.id][0]}</span>
                    <small id={detailId}>{themeCopy[theme.id][1]}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
        {isCareer && (
          <fieldset className="report-theme-selector">
            <legend>{copy.chooseCareerThemes}</legend>
            <p>{copy.chooseCareerThemesCopy}</p>
            <div className="report-theme-selector__chips">
              {careerThemes.map((theme) => {
                const detailId = `theme-${controlId}-${theme.id}`;
                return (
                  <label
                    className="report-theme-chip"
                    key={theme.id}
                    title={careerThemeCopy[theme.id][1]}
                  >
                    <input
                      type="checkbox"
                      checked={careerSelections.includes(theme.id)}
                      aria-describedby={detailId}
                      onChange={(event) =>
                        setCareerSelections((current) =>
                          event.target.checked
                            ? [...current, theme.id]
                            : current.filter((item) => item !== theme.id),
                        )
                      }
                    />
                    <span>{careerThemeCopy[theme.id][0]}</span>
                    <small id={detailId}>{careerThemeCopy[theme.id][1]}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
        <button
          type="button"
          className="report-generator__submit button-secondary"
          disabled={
            busy ||
            !profiles.length ||
            (isCareer && careerSelections.length === 0) ||
            (isRecovery && themes.length === 0)
          }
          onClick={generate}
        >
          {busy
            ? copy.queueing
            : entitlementId
              ? copy.produceReport
              : copy.generateReport}
        </button>
        {status && (
          <p role="status" className="report-generator__status">
            {status}
          </p>
        )}
      </div>
    </details>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recoveryThemes, type RecoveryTheme } from "@/lib/reports/recovery";
import { useLocale } from "@/components/LocaleProvider";

type Option = { id: string; label: string };
export function GenerateReportButton({
  entitlementId,
  profiles,
  reportType,
}: {
  entitlementId?: string;
  profiles: Option[];
  reportType: string;
}) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [themes, setThemes] = useState<RecoveryTheme[]>([]);
  const isRecovery = reportType === "recovery_reflection";
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
          ...(isRecovery ? { adultConfirmed, recoveryThemes: themes } : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      router.push("/account#reports");
      router.refresh();
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
      <button
        type="button"
        className="button-primary"
        disabled={
          busy ||
          !profiles.length ||
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

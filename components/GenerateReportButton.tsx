"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recoveryThemes, type RecoveryTheme } from "@/lib/reports/recovery";

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
  async function generate() {
    if (!profileId)
      return setStatus("Save a birth profile before generating this report.");
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
      router.push(`/reports/${payload.reportId}`);
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "The report could not be queued.",
      );
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
        Use birth profile
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
          <option value="">No saved birth profiles</option>
        )}
      </select>
      {isRecovery && (
        <fieldset className="recovery-compass">
          <legend>Choose your reflection themes</legend>
          <p>Select the areas you want your natal chart to illuminate.</p>
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
                  <strong>{theme.label}</strong>
                  <small>{theme.detail}</small>
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
            <span>I confirm that I am 18 or older.</span>
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
        {busy ? "Queueing…" : "Generate report"}
      </button>
      {status && (
        <p role="status" className="text-sm text-[#d7bd7b]">
          {status}
        </p>
      )}
    </div>
  );
}

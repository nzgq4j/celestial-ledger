"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };
export function GenerateReportButton({
  entitlementId,
  profiles,
}: {
  entitlementId: string;
  profiles: Option[];
}) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function generate() {
    if (!profileId)
      return setStatus("Save a birth profile before generating this report.");
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entitlementId, birthProfileId: profileId }),
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
      <label className="label" htmlFor={`profile-${entitlementId}`}>
        Use birth profile
      </label>
      <select
        id={`profile-${entitlementId}`}
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
      <button
        type="button"
        className="button-primary"
        disabled={busy || !profiles.length}
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

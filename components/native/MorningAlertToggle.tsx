"use client";

import { useEffect, useId, useState } from "react";
import {
  documentNativeMessages,
  type NativeMessages,
} from "@/lib/native/messages";
import { isNativeAndroidApp } from "@/lib/native/platform";
import {
  enableMorningAlerts,
  fetchMorningAlert,
  pushPermission,
  updateMorningAlert,
} from "@/lib/native/push-client";

/**
 * Account tab › "Morning reading alert" (Android app only; renders nothing on
 * the web). Turning it on asks for the notification permission if needed.
 */
export function MorningAlertToggle({ className }: { className?: string }) {
  const id = useId();
  const [ready, setReady] = useState(false);
  const [copy, setCopy] = useState<NativeMessages["push"] | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("06:30");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isNativeAndroidApp()) return;
    setCopy(documentNativeMessages().push);
    void (async () => {
      try {
        const [state, permission] = await Promise.all([
          fetchMorningAlert(),
          pushPermission(),
        ]);
        setEnabled(
          state.registered &&
            state.morningAlertEnabled &&
            permission === "granted",
        );
        setTime(state.morningAlertLocalTime);
      } catch {
        // Defaults stay: off, 06:30.
      }
      setReady(true);
    })();
  }, []);

  if (!copy || !ready) return null;

  async function toggle() {
    if (!copy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!enabled) {
        const result = await enableMorningAlerts();
        if (result === "enabled") {
          const saved = await updateMorningAlert({
            morningAlertEnabled: true,
            morningAlertLocalTime: time,
          });
          setEnabled(saved.morningAlertEnabled);
          setMessage(copy.saved);
        } else {
          setMessage(result === "denied" ? copy.denied : copy.failed);
        }
      } else {
        const saved = await updateMorningAlert({ morningAlertEnabled: false });
        setEnabled(saved.morningAlertEnabled);
        setMessage(copy.saved);
      }
    } catch {
      setMessage(copy.failed);
    } finally {
      setBusy(false);
    }
  }

  async function changeTime(value: string) {
    if (!copy || !/^\d{2}:\d{2}$/.test(value)) return;
    setTime(value);
    if (!enabled) return;
    try {
      await updateMorningAlert({ morningAlertLocalTime: value });
      setMessage(copy.saved);
    } catch {
      setMessage(copy.failed);
    }
  }

  return (
    <div className={className}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <p id={`${id}-label`} style={{ margin: 0, fontWeight: 600 }}>
            {copy.toggleLabel}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.75 }}>
            {copy.toggleHint}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={`${id}-label`}
          disabled={busy}
          onClick={toggle}
          style={{
            minWidth: 64,
            minHeight: 36,
            borderRadius: 999,
            border: "1px solid var(--atlas-gold-line, rgba(201,167,93,.35))",
            background: enabled ? "var(--atlas-gold, #c9a75d)" : "transparent",
            color: enabled ? "#07111f" : "inherit",
            fontWeight: 700,
          }}
        >
          {enabled ? copy.on : copy.off}
        </button>
      </div>
      <label
        htmlFor={`${id}-time`}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          gap: 16,
        }}
      >
        <span>{copy.timeLabel}</span>
        <input
          id={`${id}-time`}
          type="time"
          step={900}
          value={time}
          disabled={busy}
          onChange={(event) => void changeTime(event.target.value)}
          style={{ minHeight: 36 }}
        />
      </label>
      <p
        role="status"
        aria-live="polite"
        style={{ margin: "8px 0 0", fontSize: 13 }}
      >
        {message}
      </p>
    </div>
  );
}

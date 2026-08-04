"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

type Profile = {
  id: string;
  label: string;
  birth_date: string;
  display_name: string;
  time_unknown: boolean;
  expires_at: string;
};

export function BirthProfileList({
  initialProfiles,
}: {
  initialProfiles: Profile[];
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string>();
  const { locale, pack } = useLocale();
  const copy = pack.messages.account;

  async function remove(id: string) {
    if (!window.confirm(copy.deleteProfileConfirm)) return;
    setError("");
    setDeleting(id);
    try {
      const response = await fetch(`/api/birth-profiles/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setProfiles((current) => current.filter((profile) => profile.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.deletionFailed);
    } finally {
      setDeleting(undefined);
    }
  }

  if (!profiles.length)
    return (
      <div className="birth-profile-empty">
        <span aria-hidden="true">☉</span>
        <div>
          <strong>{copy.noChartsTitle}</strong>
          <p>{copy.noChartsCopy}</p>
        </div>
        <Link href="/#chart" className="button-primary">
          {copy.createMyChart}
        </Link>
      </div>
    );
  return (
    <div className="birth-profile-list">
      {error && (
        <p role="alert" className="rounded-lg border border-[#8b5b53] p-3">
          {error}
        </p>
      )}
      {profiles.map((profile) => (
        <article key={profile.id} className="birth-profile-card">
          <span className="birth-profile-card__glyph" aria-hidden="true">
            ✦
          </span>
          <div className="birth-profile-card__body">
            <p className="section-kicker">{copy.natalChart}</p>
            <h3>{profile.label}</h3>
            <p>
              {profile.birth_date} ·{" "}
              {profile.time_unknown ? copy.timeUnknown : copy.timeRecorded} ·{" "}
              {profile.display_name}
            </p>
            <small>
              {copy.heldUntil}{" "}
              {new Date(profile.expires_at).toLocaleDateString(locale)}
            </small>
          </div>
          <div className="birth-profile-card__actions">
            <Link
              href={`/account/birth-profiles/${profile.id}`}
              className="button-primary"
            >
              {copy.openChart}
            </Link>
            <button
              type="button"
              onClick={() => remove(profile.id)}
              disabled={deleting === profile.id}
              className="birth-profile-card__delete"
            >
              {deleting === profile.id ? copy.deleting : copy.delete}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

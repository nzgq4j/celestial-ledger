"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { memberCopy } from "@/lib/account/member-copy";

type Profile = {
  id: string;
  label: string;
  birth_date: string;
  display_name: string;
  time_unknown: boolean;
  expires_at: string;
  natal_reading_generated_at: string | null;
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
  const member = memberCopy[locale];

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
      <div className="atlas-card atlas-card--sm profile-empty">
        <span className="profile-empty__glyph" aria-hidden="true">
          ☉︎
        </span>
        <div>
          <h3>{copy.noChartsTitle}</h3>
          <p>{copy.noChartsCopy}</p>
        </div>
        <Link href="/#chart" className="atlas-button-ghost">
          {copy.createMyChart}
        </Link>
      </div>
    );
  return (
    <div className="library-list profile-list">
      {error && (
        <p role="alert" className="member-error">
          {error}
        </p>
      )}
      {profiles.map((profile) => (
        <article key={profile.id} className="library-row profile-row">
          <div className="library-row__identity">
            <h3 className="library-row__title">{profile.label}</h3>
            <p className="library-row__meta">
              {profile.birth_date} ·{" "}
              {profile.time_unknown ? copy.timeUnknown : copy.timeRecorded} ·{" "}
              {profile.display_name}
            </p>
            <p className="library-row__meta">
              {copy.heldUntil}{" "}
              {new Date(profile.expires_at).toLocaleDateString(locale)}
              {" · "}
              <span
                className={
                  profile.natal_reading_generated_at
                    ? "profile-row__reading is-complete"
                    : "profile-row__reading"
                }
              >
                {profile.natal_reading_generated_at
                  ? member.interpretationSaved
                  : member.interpretationMissing}
              </span>
            </p>
          </div>
          <div className="library-row__actions">
            <Link
              href={`/account/birth-profiles/${profile.id}`}
              className="library-row__open"
            >
              {copy.openChart}
            </Link>
            <button
              type="button"
              onClick={() => remove(profile.id)}
              disabled={deleting === profile.id}
              className="library-row__action library-row__action--danger"
            >
              {deleting === profile.id ? copy.deleting : copy.delete}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";

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

  async function remove(id: string) {
    if (!window.confirm("Delete this birth profile and any dependent reports?"))
      return;
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
      setError(caught instanceof Error ? caught.message : "Deletion failed.");
    } finally {
      setDeleting(undefined);
    }
  }

  if (!profiles.length)
    return (
      <div className="birth-profile-empty">
        <span aria-hidden="true">☉</span>
        <div>
          <strong>No birth charts saved yet</strong>
          <p>Your first chart will become the foundation of this atlas.</p>
        </div>
        <Link href="/#chart" className="button-primary">
          Create my chart
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
            <p className="section-kicker">Natal chart</p>
            <h3>{profile.label}</h3>
            <p>
              {profile.birth_date} ·{" "}
              {profile.time_unknown ? "time unknown" : "time recorded"} ·{" "}
              {profile.display_name}
            </p>
            <small>
              Held privately until{" "}
              {new Date(profile.expires_at).toLocaleDateString()}
            </small>
          </div>
          <div className="birth-profile-card__actions">
            <Link
              href={`/account/birth-profiles/${profile.id}`}
              className="button-primary"
            >
              Open chart
            </Link>
            <button
              type="button"
              onClick={() => remove(profile.id)}
              disabled={deleting === profile.id}
              className="birth-profile-card__delete"
            >
              {deleting === profile.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

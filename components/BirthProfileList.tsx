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
    return <p className="mt-3 text-[#b9b2a3]">No saved birth profiles.</p>;
  return (
    <div className="mt-4 grid gap-3">
      {error && (
        <p role="alert" className="rounded-lg border border-[#8b5b53] p-3">
          {error}
        </p>
      )}
      {profiles.map((profile) => (
        <article
          key={profile.id}
          className="rounded-lg border border-[#34455c] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{profile.label}</h3>
              <p className="text-sm text-[#b9b2a3]">
                {profile.birth_date} ·{" "}
                {profile.time_unknown ? "time unknown" : "time recorded"} ·{" "}
                {profile.display_name}
              </p>
              <p className="mt-1 text-xs text-[#b9b2a3]">
                Scheduled expiry:{" "}
                {new Date(profile.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/account/birth-profiles/${profile.id}`}
                className="rounded-lg bg-[#c9a75d] px-3 py-2 text-sm font-semibold text-[#07111f]"
              >
                View natal chart
              </Link>
              <button
                type="button"
                onClick={() => remove(profile.id)}
                disabled={deleting === profile.id}
                className="rounded-lg border border-[#8b5b53] px-3 py-2 text-sm"
              >
                {deleting === profile.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

export function AuthForm({ disabled = false }: { disabled?: boolean }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setEmail(sessionStorage.getItem("celestial-atlas-marketing-email") ?? "");
    setDisplayName(
      sessionStorage.getItem("celestial-atlas-marketing-name") ?? "",
    );
  }, []);

  return (
    <form className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="display-name">
          Display name
        </label>
        <input
          className="input"
          id="display-name"
          name="display_name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          minLength={2}
          maxLength={50}
          autoComplete="name"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          minLength={8}
          autoComplete="current-password"
          required
        />
        <p className="mt-2 text-xs text-[#8f98a6]">
          New accounts require at least 12 characters. Existing users can sign
          in with their current password.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={disabled}
          formAction={signIn}
          className="rounded-lg bg-[#c9a75d] px-5 py-3 font-semibold text-[#07111f]"
        >
          Sign in
        </button>
        <button
          disabled={disabled}
          formAction={signUp}
          className="rounded-lg border border-[#536177] px-5 py-3"
        >
          Create account
        </button>
      </div>
      <p className="text-xs text-[#8f98a6]">
        Creating an account does not change your email-marketing preference.
      </p>
    </form>
  );
}

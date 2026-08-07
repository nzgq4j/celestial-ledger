"use client";

import { useEffect, useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

export function AuthForm({
  mode,
  disabled = false,
}: {
  mode: "login" | "create";
  disabled?: boolean;
}) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(sessionStorage.getItem("celestial-atlas-marketing-email") ?? "");
  }, []);

  return (
    <form
      action={mode === "login" ? signIn : signUp}
      className="mt-6 space-y-4"
    >
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
          minLength={mode === "create" ? 12 : 1}
          autoComplete={mode === "create" ? "new-password" : "current-password"}
          required
        />
        {mode === "create" && (
          <p className="mt-2 text-xs text-[#8f98a6]">
            Use at least 12 characters.
          </p>
        )}
      </div>
      <button
        disabled={disabled}
        className="w-full rounded-lg bg-[#c9a75d] px-5 py-3 font-semibold text-[#07111f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mode === "login" ? "Sign in with email" : "Create account with email"}
      </button>
      {mode === "create" && (
        <p className="text-xs text-[#8f98a6]">
          Creating an account does not change your email-marketing preference.
        </p>
      )}
    </form>
  );
}

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
      <div className="atlas-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="atlas-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={mode === "create" ? 12 : 1}
          autoComplete={mode === "create" ? "new-password" : "current-password"}
          required
        />
        {mode === "create" && (
          <p className="atlas-auth__hint">Use at least 12 characters.</p>
        )}
      </div>
      <button disabled={disabled} className="atlas-button atlas-auth__submit">
        {mode === "login" ? "Sign in with email" : "Create account with email"}
      </button>
      {mode === "create" && (
        <p className="atlas-auth__hint">
          Creating an account does not change your email-marketing preference.
        </p>
      )}
    </form>
  );
}

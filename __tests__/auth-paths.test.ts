import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authForm = readFileSync("components/AuthForm.tsx", "utf8");
const googleForm = readFileSync("components/GoogleAuthForm.tsx", "utf8");
const actions = readFileSync("app/auth/actions.ts", "utf8");
const loginPage = readFileSync("app/auth/login/page.tsx", "utf8");
const createPage = readFileSync("app/auth/create-account/page.tsx", "utf8");

describe("separate authentication paths", () => {
  it("keeps login and account creation on distinct screens", () => {
    expect(loginPage).toContain('href="/auth/create-account"');
    expect(loginPage).toContain('<AuthForm mode="login"');
    expect(createPage).toContain('href="/auth/login"');
    expect(createPage).toContain('<AuthForm mode="create"');
  });

  it("offers Google on both paths with path-specific actions", () => {
    expect(loginPage).toContain('<GoogleAuthForm mode="login"');
    expect(createPage).toContain('<GoogleAuthForm mode="create"');
    expect(googleForm).toContain("createAccountWithGoogle");
    expect(actions).toContain('continueWithGoogle("/auth/login")');
    expect(actions).toContain('continueWithGoogle("/auth/create-account")');
  });

  it("uses email as the only typed account identifier", () => {
    expect(authForm).toContain('name="email"');
    expect(authForm).toContain('name="password"');
    expect(authForm).not.toContain("display_name");
    expect(actions).not.toContain('formData.get("display_name")');
  });
});

import { signOut } from "@/app/auth/actions";
import {
  changeAccountPassword,
  deleteAccount,
  updateDisplayName,
} from "@/app/account/actions";

export function AccountSettings({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <section className="account-settings" id="account-settings">
      <div className="account-settings__heading">
        <div>
          <p className="section-kicker">Account management</p>
          <h2>Your details and security</h2>
        </div>
        <form action={signOut}>
          <button className="button-quiet" type="submit">
            Log out
          </button>
        </form>
      </div>

      <div className="account-settings__grid">
        <form action={updateDisplayName} className="account-form">
          <div>
            <h3>Profile</h3>
            <p>Choose the name shown in your private dashboard.</p>
          </div>
          <label>
            <span>Display name</span>
            <input
              name="display_name"
              defaultValue={displayName}
              minLength={2}
              maxLength={50}
              autoComplete="name"
              required
            />
          </label>
          <label>
            <span>Email address</span>
            <input value={email} disabled aria-describedby="email-note" />
          </label>
          <small id="email-note">
            Email changes require a verified confirmation flow.
          </small>
          <button className="button-primary" type="submit">
            Save name
          </button>
        </form>

        <form action={changeAccountPassword} className="account-form">
          <div>
            <h3>Change password</h3>
            <p>Confirm your current password before choosing a new one.</p>
          </div>
          <label>
            <span>Current password</span>
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            <span>New password</span>
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            <span>Confirm new password</span>
            <input
              name="password_confirmation"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="button-primary" type="submit">
            Change password
          </button>
        </form>
      </div>

      <details className="danger-zone">
        <summary>Delete account</summary>
        <div className="danger-zone__body">
          <p>
            Permanently removes your birth profiles, reports, evidence, and
            account. Minimized payment records may be retained where legally
            required.
          </p>
          <form
            action={deleteAccount}
            className="account-form account-form--danger"
          >
            <label>
              <span>Current password</span>
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              <span>Type DELETE to confirm</span>
              <input
                name="confirmation"
                pattern="DELETE"
                autoComplete="off"
                required
              />
            </label>
            <button className="button-danger" type="submit">
              Permanently delete account
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}

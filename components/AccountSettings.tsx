import { signOut } from "@/app/auth/actions";
import {
  changeAccountPassword,
  deleteAccount,
  updateDisplayName,
} from "@/app/account/actions";
import type { TranslationPack } from "@/lib/i18n/config";

export function AccountSettings({
  displayName,
  email,
  copy,
}: {
  displayName: string;
  email: string;
  copy: TranslationPack["messages"]["account"];
}) {
  return (
    <section className="account-settings" id="account-settings">
      <div className="account-settings__heading">
        <div>
          <p className="section-kicker">{copy.managementKicker}</p>
          <h2>{copy.detailsSecurity}</h2>
        </div>
        <form action={signOut}>
          <button className="button-quiet" type="submit">
            {copy.logOut}
          </button>
        </form>
      </div>

      <div className="account-settings__grid">
        <form action={updateDisplayName} className="account-form">
          <div>
            <h3>{copy.profile}</h3>
            <p>{copy.profileCopy}</p>
          </div>
          <label>
            <span>{copy.displayName}</span>
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
            <span>{copy.emailAddress}</span>
            <input value={email} disabled aria-describedby="email-note" />
          </label>
          <small id="email-note">{copy.emailNote}</small>
          <button className="button-primary" type="submit">
            {copy.saveName}
          </button>
        </form>

        <form action={changeAccountPassword} className="account-form">
          <div>
            <h3>{copy.changePassword}</h3>
            <p>{copy.changePasswordCopy}</p>
          </div>
          <label>
            <span>{copy.currentPassword}</span>
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            <span>{copy.newPassword}</span>
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            <span>{copy.confirmPassword}</span>
            <input
              name="password_confirmation"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="button-primary" type="submit">
            {copy.changePassword}
          </button>
        </form>
      </div>

      <details className="danger-zone">
        <summary>{copy.deleteAccount}</summary>
        <div className="danger-zone__body">
          <p>{copy.deleteAccountCopy}</p>
          <form
            action={deleteAccount}
            className="account-form account-form--danger"
          >
            <label>
              <span>{copy.currentPassword}</span>
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              <span>{copy.typeDelete}</span>
              <input
                name="confirmation"
                pattern="DELETE"
                autoComplete="off"
                required
              />
            </label>
            <button className="button-danger" type="submit">
              {copy.permanentlyDelete}
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}

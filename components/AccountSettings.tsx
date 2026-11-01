import { signOut } from "@/app/auth/actions";
import {
  changeAccountPassword,
  deleteAccount,
  updateDisplayName,
  updateReportLocale,
} from "@/app/account/actions";
import type { TranslationPack } from "@/lib/i18n/config";
import { localeRegistry, localeTags, type LocaleTag } from "@/lib/i18n/config";

export function AccountSettings({
  displayName,
  email,
  copy,
  reportLocale,
}: {
  displayName: string;
  email: string;
  copy: TranslationPack["messages"]["account"];
  reportLocale: LocaleTag;
}) {
  return (
    <section
      className="member-settings"
      id="account-settings"
      aria-labelledby="account-settings-title"
    >
      <div className="member-settings__heading">
        <h2 id="account-settings-title" className="member-subtitle">
          {copy.detailsSecurity}
        </h2>
        <form action={signOut}>
          <button className="atlas-button-ghost atlas-button--sm" type="submit">
            {copy.logOut}
          </button>
        </form>
      </div>

      <div className="member-settings__grid">
        <form
          action={updateReportLocale}
          className="atlas-card atlas-card--sm settings-form"
        >
          <div className="settings-form__intro">
            <h3>{copy.reportLanguage}</h3>
            <p>{copy.reportLanguageCopy}</p>
          </div>
          <label className="atlas-field">
            <span>{copy.defaultReportLanguage}</span>
            <select name="report_locale" defaultValue={reportLocale}>
              {localeTags.map((tag) => (
                <option key={tag} value={tag} lang={tag}>
                  {localeRegistry[tag].nativeName}
                </option>
              ))}
            </select>
          </label>
          <small>{copy.reportLanguageNote}</small>
          <button className="atlas-button-ghost" type="submit">
            {copy.saveReportLanguage}
          </button>
        </form>
        <form
          action={updateDisplayName}
          className="atlas-card atlas-card--sm settings-form"
        >
          <div className="settings-form__intro">
            <h3>{copy.profile}</h3>
            <p>{copy.profileCopy}</p>
          </div>
          <label className="atlas-field">
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
          <label className="atlas-field">
            <span>{copy.emailAddress}</span>
            <input value={email} disabled aria-describedby="email-note" />
          </label>
          <small id="email-note">{copy.emailNote}</small>
          <button className="atlas-button-ghost" type="submit">
            {copy.saveName}
          </button>
        </form>

        <form
          action={changeAccountPassword}
          className="atlas-card atlas-card--sm settings-form"
        >
          <div className="settings-form__intro">
            <h3>{copy.changePassword}</h3>
            <p>{copy.changePasswordCopy}</p>
          </div>
          <label className="atlas-field">
            <span>{copy.currentPassword}</span>
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="atlas-field">
            <span>{copy.newPassword}</span>
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="atlas-field">
            <span>{copy.confirmPassword}</span>
            <input
              name="password_confirmation"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="atlas-button-ghost" type="submit">
            {copy.changePassword}
          </button>
        </form>
      </div>

      <details className="settings-danger">
        <summary>{copy.deleteAccount}</summary>
        <div className="settings-danger__body">
          <p>{copy.deleteAccountCopy}</p>
          <form
            action={deleteAccount}
            className="settings-form settings-form--danger"
          >
            <label className="atlas-field">
              <span>{copy.currentPassword}</span>
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label className="atlas-field">
              <span>{copy.typeDelete}</span>
              <input
                name="confirmation"
                pattern="DELETE"
                autoComplete="off"
                required
              />
            </label>
            <button className="atlas-button member-button-danger" type="submit">
              {copy.permanentlyDelete}
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}

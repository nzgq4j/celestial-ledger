# Celestial Atlas Supabase email artifacts

Copy each subject and the complete contents of its HTML file into the matching Supabase **Authentication > Emails** template.

| Supabase dashboard template | Subject                                                  | Body                                       |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| Confirm sign up             | `Confirm your Celestial Atlas account`                   | [HTML](./confirm-sign-up.html)             |
| Invite user                 | `You’re invited to Celestial Atlas`                      | [HTML](./invite-user.html)                 |
| Magic link or OTP           | `Your Celestial Atlas sign-in link`                      | [HTML](./magic-link-or-otp.html)           |
| Change email address        | `Confirm your new Celestial Atlas email address`         | [HTML](./change-email-address.html)        |
| Reset password              | `Reset your Celestial Atlas password`                    | [HTML](./reset-password.html)              |
| Reauthentication            | `{{ .Token }} is your Celestial Atlas verification code` | [HTML](./reauthentication.html)            |
| Password changed            | `Your Celestial Atlas password was changed`              | [HTML](./password-changed.html)            |
| Email address changed       | `Your Celestial Atlas email address was changed`         | [HTML](./email-address-changed.html)       |
| Phone number changed        | `Your Celestial Atlas phone number was changed`          | [HTML](./phone-number-changed.html)        |
| Sign-in method linked       | `A sign-in method was linked to Celestial Atlas`         | [HTML](./sign-in-method-linked.html)       |
| Sign-in method removed      | `A sign-in method was removed from Celestial Atlas`      | [HTML](./sign-in-method-removed.html)      |
| Verification method added   | `A verification method was added to Celestial Atlas`     | [HTML](./verification-method-added.html)   |
| Verification method removed | `A verification method was removed from Celestial Atlas` | [HTML](./verification-method-removed.html) |

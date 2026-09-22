# HHQ AuthKit rollout

## Status and scope

AuthKit is implemented behind `HHQ_AUTH_PROVIDER=workos`. The default remains
Firebase until live cutover is verified. HHQ staff only; public inquiries and
Plan Your Home remain account-free. Firebase database/files and Vercel OIDC
remain unchanged. See [ADR 0004](adr/0004-use-individual-hhq-staff-accounts.md).

A dedicated **H and H** WorkOS project has staging and production environments.
Both have public signup, password login, enterprise SSO, and Radar disabled;
Google and Magic Auth enabled; five-day maximum/inactivity sessions; five-minute
access tokens; and no added MFA prompt. Only the owner's selected WorkOS-account
email has been enrolled with the **HHQ staff** role. The default `member` role
confers no HHQ access.

The persistent production origin is `https://hh-website-pi.vercel.app`. A final
business domain is not required. Callback and logout URLs are registered on
that host. Staging also permits localhost ports 3000 and 3015.

Production cutover is pending: create/store the production WorkOS API key,
complete Google's OAuth app setup and production credentials, configure Vercel,
and prove real Google and email-code sign-in. Local SDK
proof is not evidence of real Google authorization or email delivery. The owner added a payment method; no paid add-ons were enabled.

## Zero-spend boundary

Use only the included AuthKit allowance, WorkOS-hosted login domain, and default
sender. No custom auth/email domain, Radar, enterprise SSO, Directory Sync,
paid audit-log service, or paid infrastructure. Adding billing details does not
authorize charges. The published free allowance is not a verified hard spending
cap; do not enable a paid product to finish setup.

## Configuration and cutover

1. In WorkOS **H and H → Production**, use the existing H and H organization and
   the `hhq-staff` role. Keep signup disabled and the ordinary member role
   unprivileged. Provision users explicitly by exact email.
2. Complete the Google Auth Platform app in Google Cloud project
   `howeth-and-harp`. Use Google's standard identity scopes only. Configure the
   OAuth web client using the callback URL shown by WorkOS's Google integration,
   then save that client in WorkOS Production. Staging's shared Google credentials
   do not work in production. The owner accepts Google's User Data Policy.
3. Store these in Vercel's **production** environment, with secrets protected:

   | Variable | Value/source |
   | --- | --- |
   | `HHQ_AUTH_PROVIDER` | `workos`, enabled only for the cutover deployment |
   | `WORKOS_API_KEY` | H and H production API key; never commit or print it |
   | `WORKOS_CLIENT_ID` | `client_01M34XAGZ7WRSRXH1TVS21Z223` |
   | `WORKOS_ORGANIZATION_ID` | `org_01M34XFMHZTTS7BS4R9VA8M1BS` |
   | `WORKOS_COOKIE_PASSWORD` | Separate random secret of at least 32 characters |
   | `WORKOS_COOKIE_MAX_AGE` | `432000` |
   | `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | `https://hh-website-pi.vercel.app/admin/callback` |

   Keep the SDK's default `wos-session` cookie name. Do not enable its browser
   JWT-cookie option. Do not copy staging keys into production or use production
   identities for automated QA. All variables except the redirect URI stay
   server-only. Do not change Firebase/OIDC environment values.
4. Confirm the registered logout URL is
   `https://hh-website-pi.vercel.app/admin/login?signed_out=1` and initiate-login
   URL is `https://hh-website-pi.vercel.app/admin/sign-in`. Deploy.
5. Prove real Google sign-in and emailed-code receipt with the owner; verify
   HHQ projects, inquiries, settings, logout, and re-entry. An unapproved account
   must receive no HHQ data. Confirm old Firebase cookies grant no WorkOS access.
6. Revoke the owner's test session and verify the old browser loses access,
   then sign in again. Do not remove the only owner membership as a live test.
   Retain concise results without emails, codes, tokens, screenshots of private
   data, or credentials. Only then report live migration complete.

The code checks current organization membership and sessions on every protected
request, independent of token claims. A removed role/membership or revoked
session immediately loses access on the next server request. API outages deny
access. All staff share one privilege level; WorkOS workspace administration is
separate from HHQ use.

## Local verification

Use Node 24:

```bash
npm test
npm run lint
npm run typecheck
npm run proof:hhq-auth
npm run qa:smoke
```

The AuthKit proof runs a production build and the real SDK against a local
OAuth/API fixture. It uses generated `.invalid` identities and no real provider,
mail, or Firebase data. It covers approved/denied callbacks, spoofed headers,
PKCE cleanup, scoped cookies, token refresh, removed membership, revoked session,
private-file rejection, provider outage, logout, and forged callback. Inspect
`output/workos-auth/login-desktop.png`, `login-phone.png`, and `summary.json`.

The complete smoke suite explicitly uses the legacy Firebase provider and local
emulators to retain broad data/publication/inquiry regression coverage during
the migration. Run both suites; one is not a substitute for the other. If using
an existing browser installation, both accept
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Neither proof changes production accounts.

## Rollback and future domain

If live sign-in fails, restore `HHQ_AUTH_PROVIDER=firebase` and redeploy with the
retained Firebase configuration. This intentionally restores the prior shared
account and its custom-claim rules; it is not an automatic fallback. Confirm
legacy sign-in and private-page protection. Revoke any WorkOS sessions affected
by the failed rollout. Do not delete provider accounts or secrets during rollback.

When the business domain is ready, register its exact HTTPS callback and logout
URLs first, update the redirect URI and initiate-login URL, and deploy. Verify
both sign-in methods and logout on the new host before removing old URLs.
Keep the included WorkOS-hosted auth domain; purchasing a branded auth domain is
not necessary. Existing cookies do not move between hosts, so staff sign in again.

## Sources checked 2026-09-22

- [WorkOS pricing](https://workos.com/pricing)
- [Environment setup](https://workos.com/docs/authkit/environments)
- [Google OAuth setup](https://workos.com/docs/integrations/google-oauth)
- [Default email sender](https://workos.com/docs/custom-domains/email)
- [Next.js SDK](https://workos.com/docs/sdks/authkit-nextjs)

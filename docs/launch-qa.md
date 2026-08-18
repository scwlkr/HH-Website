# Launch QA

Use this checklist before preview or production launch.

## Local Automated QA

Run:

```bash
npx playwright install chromium
npm run qa:smoke
```

The smoke suite builds the app, starts a local production server, and checks:

- public route coverage
- invalid finish and build-type slugs
- project brief query-param prefill
- header, footer, legal, email, and phone links
- mobile, tablet, and desktop overflow behavior
- project brief validation failure handling
- project brief server-error handling
- success redirect and persistence payload shape

The script starts isolated Firebase Auth, Firestore, and Storage emulators, so local smoke QA does not write to the production project.

## Environment Checklist

Set real values in preview and production:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `PLAN_HOME_DRAFT_SESSION_SECRET`
- `PLAN_HOME_RESUME_SECRET`
- `PLAN_HOME_PUBLIC_ORIGIN`
- `PLAN_HOME_CLEANUP_SECRET` (unique, server-only, at least 32 characters)
- `HH_CONTACT_PHONE_HREF`
- `HH_CONTACT_PHONE_LABEL`
- `HH_CONTACT_EMAIL`

Optional:

- `INQUIRY_NOTIFICATION_EMAIL`

Plan Your Home resume email remains a launch hold until the sending domain is
verified. Then configure `PLAN_HOME_RESUME_MAIL_TRANSPORT=resend`,
`PLAN_HOME_RESUME_EMAIL_FROM`, and `RESEND_API_KEY`. Do not use the fake transport
outside local Firebase emulator proof, and do not change provider or DNS state as
part of local QA.

Keep secret values out of docs, issues, screenshots, and chat.

Configure an approved HTTPS scheduler to call
`/api/internal/plan-your-home/cleanup` with the cleanup secret in a Bearer
authorization header. Do not place the secret in the URL. Confirm the deployed
Firebase server identity can query and delete the scoped Firestore records and
list, inspect, and delete the scoped Storage objects; confirm required indexes;
and alert on generic cleanup failures without logging credentials or private
client data. Provider selection, credentials, schedule frequency, and the first
production run remain manual launch prerequisites.

Vercel server access is keyless. Configure:

- `GCP_PROJECT_ID`
- `GCP_PROJECT_NUMBER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`

Do not create or upload a service-account JSON key.
Set these on the `scwlkrs-projects/hh-website` Vercel project for both preview and production as appropriate.

## Firebase Checklist

- Confirm the project ID is `howeth-and-harp`.
- Enable email/password Firebase Auth.
- Create the default Firestore database and deploy `firestore.rules` and `firestore.indexes.json`.
- Upgrade the project to Blaze, provision `howeth-and-harp.firebasestorage.app`, and deploy `storage.rules`.
- Confirm Firestore and Storage rules deny direct client access.
- Create the intended admin user.
- Set that user's Firebase custom claim to `{ "role": "admin" }`.
- Keep email/password as the only intended sign-in method, enable email
  enumeration protection, and confirm only approved production and local Auth
  domains remain authorized. Creating an ordinary Firebase user must not grant
  HHQ access.
- Configure Vercel OIDC through the `vercel` Workload Identity pool and provider.
- Restrict the Workload Identity provider subject to the intended Vercel project
  and production environment. Confirm the dedicated Google service account has
  only the Firestore, Storage, Auth, token-signing, and impersonation access the
  server actually uses, and has no user-managed JSON keys. The HHQ Auth role is
  the project role `hhWebsiteFirebaseAuthRuntime`, limited to
  `firebaseauth.users.createSession` and `firebaseauth.users.get`; do not replace
  it with Firebase Authentication Admin.

Record live provider evidence separately from emulator proof. Before launch and
after staffing changes, verify the deployed rules, sign-in methods, authorized
domains, OIDC subject restriction, service-account roles/key absence, and an
old-session denial. Never copy tokens, passwords, customer data, signed file
URLs, or environment values into the evidence.

## Local Emulators

`firebase.json` defines Auth on `9099`, Firestore on `8080`, Storage on `9199`, and the Emulator UI on `4000`. Start them with:

```bash
npx -y firebase-tools@latest emulators:start --project howeth-and-harp
```

For a separately started Next.js process, copy these commented emulator variables from `.env.example` into `.env.local`. Remove them before any production-data check:

- `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST`
- `FIREBASE_AUTH_EMULATOR_HOST`
- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_STORAGE_EMULATOR_HOST`

Local access to real Firebase uses:

```bash
gcloud auth application-default login
```

## Preview Checks

- Preview deploy renders every public route.
- `/admin/login` loads when Firebase web app configuration is present.
- Non-admin users cannot access protected HHQ routes.
- Admin users can create and edit a project.
- Saved projects appear at `/projects` and `/projects/[projectSlug]`.
- Pricing settings appear on public pricing surfaces.
- Inquiry submissions persist to Firestore.
- Analytics events reach the selected destination if one is connected.

## Production Hold Points

Do not treat the site as launch-ready until:

- final phone and email values are confirmed
- owner-approved legal content is in place
- counsel has approved the Plan Your Home privacy, retention/deletion, and
  non-contract disclosures; the repository copy is currently a proposal only
- the authenticated retention cleanup schedule, Firebase permissions, indexes,
  and failure monitoring are configured and verified in the production provider
- privacy and terms noindex behavior is intentionally resolved
- final production imagery replaces placeholders where required
- Firebase Auth, Firestore, Storage, OIDC, and environment values are confirmed in production

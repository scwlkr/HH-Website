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
- `HH_CONTACT_PHONE_HREF`
- `HH_CONTACT_PHONE_LABEL`
- `HH_CONTACT_EMAIL`

Optional:

- `INQUIRY_NOTIFICATION_EMAIL`

Keep secret values out of docs, issues, screenshots, and chat.

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
- Confirm public signup behavior matches the owner-approved access model.
- Configure Vercel OIDC through the `vercel` Workload Identity pool and provider.

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
- privacy and terms noindex behavior is intentionally resolved
- final production imagery replaces placeholders where required
- Firebase Auth, Firestore, Storage, OIDC, and environment values are confirmed in production

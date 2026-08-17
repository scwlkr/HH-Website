# Keep HHQ in the website with low-friction staff access

- Status: Accepted
- Date: 2026-08-17

## Context

h and h is expediting a small business with roughly five customers. HHQ needs practical protection for customer inquiries, private references, completed homes, and pricing without the delay and daily friction of a separate admin deployment, individual permission tiers, multi-factor codes, or recovery infrastructure.

## Decision

Keep HHQ as the staff-only `/admin` workspace inside the existing Vercel-hosted website, with Firebase Auth, Firestore, and Storage behind trusted server boundaries. Authorized staff share one password-only HHQ account and one equal access level; the password is unique and approximately 20 characters with mixed case, numbers, and symbols. Keep the five-day session on trusted personal devices, add only low-friction hardening, and do not add multi-factor authentication, backups, trash, or recoverable deletion.

Low-friction hardening means restricting the HHQ session cookie to the admin path, adding compatible response security headers, preserving server-side authorization on every protected entry point, limiting login abuse, and verifying the live Firebase rules plus Vercel OIDC and Google permissions. Inquiry deletion remains permanent after an explicit warning and confirmation.

## Consequences

- HHQ cannot identify which staff member performed an action.
- When staff access changes, the shared password must change and all existing sessions must be revoked.
- A stolen password compromises the full HHQ account.
- Deleted records and files cannot be recovered.
- A future increase in staff, customers, regulatory needs, or private-data value should trigger a new decision about individual accounts, multi-factor authentication, audit attribution, backups, and stronger isolation.

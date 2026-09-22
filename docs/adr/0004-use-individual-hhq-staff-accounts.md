# Use AuthKit for individual HHQ staff accounts with equal access

- Status: Accepted design; implementation pending
- Date: 2026-09-22
- Partially supersedes: [ADR 0002](0002-keep-hhq-in-the-website-with-low-friction-access.md), for Firebase authentication, shared identity, password-only sign-in, and lack of individual attribution

HHQ remains the private workspace for H and H staff, with one equal access level and no customer accounts in this rollout. Each staff member will have an individual account instead of sharing one login, allowing access to be removed for one person without replacing everyone's credentials. The owner accepted the extra account setup in exchange for simpler staff access management.

Use hosted WorkOS AuthKit with Google and emailed one-time codes because the owner prefers its sign-in experience and free tier. The owner manages staff enrollment, approval, and removal through the WorkOS dashboard; public signup is disabled. Signing in or accepting an invitation alone must not grant HHQ access: the server must also verify current, owner-approved staff access. All approved staff have equal access inside HHQ; WorkOS workspace administration is separate.

Implement and verify the integration before enabling it for staff on the existing persistent Vercel HTTPS address. The final business domain is not a prerequisite. Keep HHQ inside the website and retain Firebase for its existing database and files. Keep the five-day trusted-device session, no additional MFA prompts, and the existing deletion policy.

## Cost constraint

The owner requires $0 spending for this auth integration and will enter any required production billing details personally. Use the included WorkOS-hosted login URL and default email sender. Do not purchase custom domains, enable metered optional products such as Radar, enterprise SSO, Directory Sync, or paid audit-log retention, or add paid infrastructure. Adding a payment method is not permission to incur charges. If the selected integration requires payment, stop and report the exact requirement instead of spending.

As checked on 2026-09-22, [WorkOS pricing](https://workos.com/pricing) includes social login and Magic Auth in AuthKit's free allowance of up to one million monthly active users. This allowance is not a verified platform-enforced spending cap. [WorkOS email documentation](https://workos.com/docs/custom-domains/email) describes delivery from the default production sender as best-effort; verify receipt during the live sign-in proof and retain Google as an alternative sign-in method.

The application still uses the shared Firebase login until a separately verified migration is implemented. Historical actions performed through that shared identity cannot be attributed to individual staff; individual accounts do not by themselves add an audit-log product or new activity-tracking features.

The initial staff identity and final shared understanding remain to be confirmed before implementation.

# Use individual HHQ staff accounts with equal access

- Status: Accepted design; implementation pending
- Date: 2026-09-22
- Partially supersedes: [ADR 0002](0002-keep-hhq-in-the-website-with-low-friction-access.md), for shared identity and lack of individual attribution only

HHQ remains the private workspace for H and H staff, with one equal access level and no customer accounts in this rollout. Each staff member will have an individual account instead of sharing one login, allowing access to be removed for one person without replacing everyone's credentials. The owner accepted the extra account setup in exchange for simpler staff access management.

WorkOS AuthKit is being evaluated for ease of use and its free tier. The provider choice, sign-in methods, enrollment and removal workflow, and rollout remain under discussion. This decision does not approve paid add-ons or change the existing data storage, session, MFA, or deletion policies.

The application still uses the shared Firebase login until a separately verified migration is implemented. Historical actions performed through that shared identity cannot be attributed to individual staff; individual accounts do not by themselves add an audit-log product or new activity-tracking features.

# Project Inquiry Architecture: Data Flow & Validation

**Audience**: Backend Engineers, Frontend Engineers touching the `/app/inquire` route.
**Purpose**: Explaining the lifecycle of an inquiry submission from the Next.js frontend to the Supabase database.

## System Objective

The website’s primary conversion mechanism is the structured project inquiry form (`/inquire`). The architectural mandate is to avoid a convoluted dump of client-side validation logic. Instead, the submission is handled entirely server-side via Next.js Server Actions, ensuring data integrity, strict form validation, and rate limiting before hitting Supabase.

## The Inquiry Pipeline

An inquiry submission passes through the following lifecycle.

### 1. Form Initialization & Data Collection

The multi-step or single-page view collects structured project constraints—never just a blank generic contact block. Form fields map to `InquiryActionState` located in `@/types/inquiry`. The client utilizes progressive disclosure on the frontend to keep the user engaged via `components/inquiry/` modules.

### 2. Form Submission via Server Action

A generic `FormData` event is dispatched to `submitInquiryAction()` in `app/inquire/actions.ts`. All execution beyond this point is evaluated on the server.

### 3. Honeypot Check

Before any processing occurs, the server evaluates `values.company`. If this hidden honeypot field contains any data, it implies a bot crawler filled out the form. The action will silently redirect the user to `/thank-you` to obfuscate the trap while preventing the hit to Supabase.

### 4. IP Rate Limiting

The application dynamically checks headers (`x-forwarded-for`, `x-real-ip`) to calculate an `ipAddress`.
```typescript
const rateLimit = checkInquiryRateLimit(getRateLimitKey(headerList));
```
Submitting rapid, concurrent inquiries from a single IP address trips the rate-limit checker. When flagged, the server halts execution and returns an error state message instructing the user to try again later.

### 5. Schema Validation

To prevent malformed data from reaching the repository layer, the parsed `FormData` is rigorously checked against localized Zod schemas via `validateInquiryValues(values)`.

- If validation passes, we proceed.
- If validation fails, `mapInquiryFieldErrors()` builds an exact map of offending input fields and bubbles a status of `"field-error"` back to the client interface so the user can amend their submission.

### 6. Database Insertion Layer

Valid submissions are transformed via `toInquirySubmissionInput(values)` and passed directly to the generic database access layer.

```typescript
await insertInquirySubmission(submissionInput);
```

Behind the scenes, we use the `@supabase/supabase-js` client initialized with `SUPABASE_SERVICE_ROLE_KEY` to guarantee inserts write safely and securely to the `inquiry_submissions` table.

### 7. Resolution & Redirect

If the promise resolves cleanly, we force a hard `redirect("/thank-you")` to exit the action and finalize the conversion funnel for the end user. If Supabase fails, we log the catastrophic failure and alert the client to retry or email HH explicitly.

## Failure Mechanisms

- **Bot Payload**: Immediate `/thank-you` redirect. Avoids rate-limit or DB exhaustion.
- **Validation Failure**: The form re-renders on the client with highlighting (`"field-error"`) without data loss.
- **Database Refusal**: Catastrophic fallback warning displayed above the form submission button (`createInquiryServerErrorState`).

## Scaling & Future Considerations

If traffic or API dependencies grow, look to adapt the `submitInquiryAction` with:

- Resend, Postmark, or SendGrid triggers for email confirmations.
- Expanded anti-spam logic including Recaptcha v3 integration if the honeypot technique reaches a rate ceiling.
- Real-time Slack or Discord notifications notifying HH of immediate project intake.

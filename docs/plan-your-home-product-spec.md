# Plan Your Home Product Specification

## Status

Planning complete for implementation. This document is the product contract for the first build of **Plan Your Home**. The issue sequence and proof requirements live in [Plan Your Home implementation roadmap](plan-your-home-implementation-roadmap.md).

The existing `/inquire` experience remains available for remodels, additions, commercial work, land-only work, and other inquiries. **Plan Your Home** is a separate `/plan-your-home` experience for prospective detached single-family new homes.

## Outcome

Plan Your Home turns a detailed new-home intake into a short, linear walkthrough of an illustrated house. Every customer sees the same seven zones. Their answers change the project brief, not the rooms or artwork.

The experience succeeds when h and h can enter the first conversation knowing the customer's project frame, household needs, room priorities, finish direction, site context, budget range, timing, and inspiration without asking the basic intake questions again.

It does not produce a floor plan, specification, price, feasibility decision, or construction commitment.

## Experience Contract

- Phone-first, portrait-first, usable without rotating the device.
- Desktop is a wider version of the same scene, not a form beside an illustration.
- Fixed, linear order with one active prompt, one obvious next action, visible progress, and Back.
- Questions open from or visually attach to relevant objects in each scene.
- Short room-to-room pans, turns, doorway moves, and match cuts create spatial continuity.
- Every structured prompt requires either an answer or an explicit `Not sure`, `None`, or `Not applicable` response.
- Optional notes and inspiration are never required.
- Answers save locally as they are made. Identified server drafts checkpoint at the contact gate and after each zone.
- Unfinished identified drafts are visible to h and h and may receive disclosed manual follow-up. There are no automated abandoned-draft reminders.
- A review screen lets the customer edit any answer before submission.

## Visual Direction

Use dimensional architectural illustration: warm paper tones, restrained architectural linework, believable perspective, light material cues, and limited brand green for active controls and progress. Avoid photorealism, configurable 3D, game controls, and imagery that could be mistaken for the customer's promised design.

Artwork is decorative and `aria-hidden`. The active prompt is one real semantic DOM form; do not maintain a hidden duplicate form for accessibility.

### Motion

- In-room reframing: 250–350 ms.
- Room transition: 300–450 ms.
- Animate opacity and transforms only unless a proven exception is required.
- Load the current and next scene, rather than all scene assets at startup.
- Under `prefers-reduced-motion`, use an immediate state change or a short crossfade with no spatial movement or completion delay.
- Do not add Remotion or XState for the first version. Remotion remains an option only for future pre-rendered assets.

## Walkthrough And Storyboard

| Beat | Prompts | Primary anchors | Transition out |
| --- | --- | --- | --- |
| Welcome exterior | Customer name | The name types onto an illustrated address plaque or nameplate | Push through the front door |
| Entry and project frame | 1–3 | Rolled plans, site map, landscape/window | Settle into the living room |
| Living Room and Home Basics | 4–11, with contact checkpoint after 6 | Floor-plan rug, stair, hall doors, console phone, family photos, seating, kitchen opening, fireplace/window, finish board | Turn through the opening into the kitchen |
| Kitchen and Dining | 12–15 | Range and island, room opening, pantry door, dining table | Move through the hall toward the primary suite |
| Primary Suite | 16–19 | Hall/stair marker, bed and window, bath doorway and vanity, closet | Pivot down the bedroom hall |
| Bedrooms and Shared Bathrooms | 20–21 | Bedroom door cluster, shared-bath doors and vanity | Turn into the utility hall |
| Laundry, Mudroom, Storage, and Home Systems | 22–25 | Washer, mudroom bench, storage built-ins, thermostat/system panel | Open the back door to the exterior |
| Garage, Exterior, Site, Outdoor Living, and Specialty Spaces | 26–30 | Garage, elevation/material samples, sun/compass/trees, patio, outbuilding/rolled plan | Blueprint match cut onto the design desk |
| Design Desk and Inspiration | 31–34 | Mood board, pinboard/scanner, priority stacks, ruler/calendar | Bind the selected sheets into the review brief |
| Review and submit | 35 | Editable plan-set summary | Submit to confirmation |

## Exact Question Registry

Stable IDs are permanent persistence keys. Public copy may improve without changing an ID's meaning. Each option also receives a stable slug matching the labels below.

### Entry And Project Frame

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 1 `project.starting-services` | Where are you starting, and what help are you looking for? | Starting point, one: Fully custom; Adapt an existing plan; Bring a completed plan; Not sure yet. Services, many: Architectural design; Building; Land development; Not sure yet. `Not sure` is exclusive within services. |
| 2 `project.lot-location` | What is your lot status, and where are you building or hoping to build? | Lot status, one: Own it; Under contract; Actively looking; Need h and h to evaluate options; Not sure yet. Location: city, county, address, or target area text; or explicit Not sure yet. |
| 3 `project.site-context` | What do you already know about the site? | Many: Flat or gently sloped; Steep or complex slope; Wooded; Important views or water; Utilities available; Well or septic; HOA or deed restrictions; Existing structure; Nothing known yet; Not sure yet. The last two are exclusive. |

### Living Room And Home Basics

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 4 `home.heated-square-feet` | What total heated square footage are you considering? | One: Under 1,000; 1,000–1,499; 1,500–1,999; 2,000–2,499; 2,500–2,999; 3,000–3,999; 4,000–4,999; 5,000+; Not sure yet. Explain that garages, porches, and unfinished areas are excluded. |
| 5 `home.stories` | How many stories are you considering? | One; One-and-a-half; Two; Three or more; Not sure yet. |
| 6 `home.bed-bath-counts` | How many bedrooms, full bathrooms, and half bathrooms do you expect? | Bedrooms: 1–5, 6+, Not sure. Full baths: 1–5, 6+, Not sure. Half baths: 0–3, 4+, Not sure. Each dimension requires a value. |
| — `contact.checkpoint` | Save your progress and resume later. | Email and phone required. Reuse welcome name. Disclose: progress will be saved, h and h may personally follow up about this project, and no reminder is sent automatically. This checkpoint is not one of the 35 planning questions. |
| 7 `home.future-support` | Who should this home support now and over the next five to ten years? | Many: Growing family; Multigenerational household; Frequent guests; Aging in place; Mobility or accessibility needs; Pets; Live-in caregiver; Downsizing; No major change expected; Not sure yet. |
| 8 `home.daily-life` | Which parts of daily life should the home support especially well? | Choose up to 4: Gathering; Quiet and privacy; Entertaining; Remote work or study; Hobbies or making; Caregiving; Pet routines; Indoor-outdoor living; Not sure yet. |
| 9 `living.relationship` | How should the main living areas relate? | Open; Connected but defined; Mostly separate; Not sure yet. |
| 10 `living.features` | What matters most in the main living area? | Choose up to 5: Fireplace; TV or media; Built-ins; Vaulted or tall ceilings; Strong views; Outdoor connection; Flexible furniture layout; None; Not sure yet. `None` and `Not sure` are exclusive. |
| 11 `home.finish-level` | Which whole-home finish level feels closest to what you want? | Builder Grade; Builder+; Custom; Not sure yet. Explain that this is one direction for the full home, not a price quote or room-by-room package. |

### Kitchen And Dining

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 12 `kitchen.use` | How will the kitchen be used most often? | Choose up to 4: Everyday cooking; Serious cooking or baking; Family gathering; Entertaining; Large groups; Catering or separate prep; Not sure yet. |
| 13 `kitchen.arrangement` | What kitchen arrangement sounds closest to what you want? | Work center, one: Single island; Double island; Peninsula; No island; Not sure. Connection, one: Open; Connected but defined; Separate; Not sure. |
| 14 `kitchen.support` | What pantry or support spaces interest you? | Many: Cabinet pantry; Walk-in pantry; Butler pantry; Scullery or prep kitchen; Appliance garage; None; Not sure yet. Define unfamiliar terms in helper copy. |
| 15 `dining.use` | How should dining work in the home? | Many: Island seating; Breakfast nook; Open everyday dining; Formal dining; Large-group dining; Outdoor connection; Not sure yet. |

### Primary Suite

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 16 `primary.location` | Where should the primary suite be located? | Main floor; Upper floor; Separate wing; No preference; Not sure yet. |
| 17 `primary.bedroom-features` | Which primary-bedroom features matter? | Many: Sitting area; Fireplace; Outdoor access; Morning bar; Strong view; Vaulted or tall ceiling; Compact and simple; None; Not sure yet. |
| 18 `primary.bath-features` | Which primary-bath features matter? | Many: Large shower; Soaking tub; Separate vanities; Private toilet room; Natural light; Curbless or accessible layout; Linen storage; Not sure yet. |
| 19 `primary.closet-access` | What should the suite's closet and access support? | Many: One shared walk-in; Separate walk-ins; Direct laundry access; Closet built-ins; Accessible clearances; None; Not sure yet. |

### Bedrooms And Shared Bathrooms

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 20 `secondary.users-layout` | Who will use the secondary bedrooms, and how should they be arranged? | Users, many: Children; Guests; Multigenerational family; Flexible bedroom/office; Caregiver; Not sure. Arrangement, one: Grouped; Split for privacy; Separate guest suite; No preference. |
| 21 `secondary.bath-sharing` | How should secondary bathrooms be shared? | Hall bath; Jack-and-Jill; Private en suites; Mixed approach; Not sure yet. Define Jack-and-Jill in helper copy. |

### Laundry, Mudroom, Storage, And Home Systems

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 22 `utility.laundry` | Where and how should laundry work? | Many: Near bedrooms; Near primary suite; Near mudroom; Multiple locations; Folding counter; Sink; Hanging space; Linen storage; Not sure yet. |
| 23 `utility.mudroom` | What should the everyday entry or mudroom handle? | Many: Shoes and coats; Bags; Deliveries; Pet gear; Dog wash; Extra fridge or freezer; Charging/drop zone; None; Not sure yet. |
| 24 `utility.storage` | Which easy-to-overlook storage needs matter? | Many: Linens; Seasonal items; Sports or outdoor gear; Hobbies; Food or bulk goods; Cleaning supplies; Luggage; Safe or storm storage; Not sure yet. |
| 25 `home.systems` | Which whole-home comfort or system priorities matter? | Choose up to 6: Energy efficiency; Generator; Solar-ready; All-electric; Smart controls; Security; Network or audio; Indoor air quality; Water filtration; Low-maintenance systems; Not sure yet. |

### Garage, Exterior, Site, Outdoor Living, And Specialty Spaces

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 26 `exterior.garage` | What should the garage accommodate? | Bays, one: No garage; 1; 2; 3; 4+; Not sure. Needs, many: Truck or SUV; EV charging; Boat or RV; Workshop; Storage; Attached or detached preference; Other short text. |
| 27 `exterior.style` | Which exterior character feels closest to the home you want? | Choose up to 2 visual cards: Hill Country or ranch; Modern farmhouse; Traditional; Transitional; Modern or contemporary; Barndominium; Spanish or Mediterranean; Not sure yet. The cards are direction, not promised designs. |
| 28 `site.relationships` | Which relationships to the site matter most? | Choose up to 4: Important views; Morning light; Evening light; Privacy; Street presence; Preserve trees; Direct outdoor connection; Future pool or outbuilding; Not sure yet. |
| 29 `exterior.outdoor-living` | Which outdoor-living features matter? | Many: Covered porch; Screened porch; Patio; Outdoor kitchen; Fireplace or firepit; Pool; Spa; Garden; Play area; Not sure yet. |
| 30 `home.specialty-spaces` | Which specialty spaces or future additions should be considered? | Many: Office; Gym; Media room; Game room; Library; Craft room; Safe or storm room; Guest suite; ADU; Workshop; Home school or music room; None; Not sure yet. |

### Design Desk And Inspiration

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 31 `design.feeling` | How should the new home feel? | Choose up to 3: Warm; Calm; Bright; Cozy; Open and airy; Refined; Simple; Bold. Optional short text for current-home likes and dislikes. |
| 32 `design.references` | What plans, images, websites, or homes communicate your direction? | Zero or more approved files and links, each with optional note; or explicit `I do not have references yet`. See reference contract below. |
| 33 `design.priorities` | What are your must-haves, nice-to-haves, and deal-breakers? | Assign previously selected features plus one custom item to: Must-have, up to 5; Nice-to-have, up to 5; Deal-breaker, up to 3. Offer `No strong priorities yet`. Do not make drag-and-drop the only interaction. |
| 34 `project.budget-timing` | What budget range and design timing are you currently planning around? | Budget, one: Under $300k; $300k–$499k; $500k–$749k; $750k–$999k; $1m–$1.49m; $1.5m–$2.49m; $2.5m+; Not sure yet. State that land is excluded and no price is calculated. Design start, one: As soon as practical; Within 3 months; 3–6 months; 6–12 months; More than 12 months; Just exploring. |

### Review And Follow-Up

| # / ID | Public prompt | Response contract |
| --- | --- | --- |
| 35 `contact.follow-up` | How should h and h follow up after you submit the project brief? | One: Email; Phone call; Text message. Require final confirmation that the customer is submitting an inquiry and permits project-related contact. Do not bundle marketing consent. |

## Review Contract

The review is grouped in the same order as the tour. It shows plain-language answer summaries, contact details, files, and links. Each group has Edit, which returns to its first prompt while retaining all answers. Returning to review must not force the customer through unchanged questions again.

Submission converts the draft to `submitted` atomically, records the accepted consent version, and shows a confirmation page. Double submission must not create duplicate records or notifications.

## Reference Contract

- Up to 10 references total: no more than 6 files and 6 links.
- File types: PDF, JPEG, PNG, WebP, and HEIC.
- Maximum 10 MB per file and 40 MB of files per draft.
- Use direct signed Cloud Storage upload, not a file body proxied through a Next.js server action.
- Validate declared extension, MIME type, and size before issuing upload permission. On finalize, inspect stored metadata and file signature, and delete rejected content.
- Store under an unguessable path such as `inquiryReferences/{draftId}/{uuid}`. Never issue public download tokens.
- HHQ file access uses short-lived signed reads.
- Links accept only normalized `http` and `https` URLs. Never fetch customer URLs on the server. Open with `noopener,noreferrer` and show the hostname.
- A removed file or abandoned, expired upload is deleted by cleanup.
- The customer keeps responsibility for material they provide. Submission gives h and h permission to review it for the inquiry; it does not transfer ownership.

## Architecture Contract

### Module Shape

Create a separate Plan Your Home domain instead of expanding the flat generic `InquiryFormValues` type.

1. A pure typed reducer/state machine owns prompt order, validation, navigation, review jumps, and commands.
2. A static registry owns the exact prompts, stable IDs, option slugs, summaries, zone, scene anchor, and camera framing.
3. Seven bespoke React scene components own illustration and spatial composition behind one shared scene interface.
4. Shared semantic prompt renderers own choice, multi-choice, grouped-choice, text, priority, and reference behavior.
5. Persistence adapters implement local snapshots and authenticated server draft checkpoints without entering scene code.

The registry must fail tests if it does not contain exactly 35 contiguous numbered questions, seven ordered zones, unique IDs, valid scene anchors, compatible answer schemas, and explicit uncertainty options where required.

### Storage Model

Keep the existing `inquirySubmissions` collection so HHQ can present one inquiry queue without a migration. Add a versioned record shape:

```text
schemaVersion: 2
experience: plan-your-home
status: draft | submitted | reviewed | spam
contact: normalized searchable contact fields
answers: map keyed by stable question ID
progress: current prompt, current zone, completed zones
references: metadata only; private objects live in Cloud Storage
source: path and non-PII attribution fields
revision: monotonically increasing integer
createdAt, updatedAt, submittedAt, expiresAt
```

HHQ treats legacy `status: new` records as submitted inquiries. Store a small set of derived fields—name, contact, target location, square-footage band, finish level, and last activity—for the list view; the stable answer map remains canonical.

All Firestore and Storage access continues through trusted server code. Do not open direct client access in security rules.

### Save And Resume

- Write a versioned local snapshot after every valid answer. Do not put raw file blobs in local storage.
- Before the contact checkpoint, the draft is anonymous and local only.
- After question 6, email and phone create the first server record.
- Checkpoint after every completed zone using revision checks or transactions and idempotency keys.
- Same-device resume returns to the exact current prompt.
- Cross-device resume returns to the last server-synced boundary.
- `/plan-your-home/resume` accepts an email address, always displays a generic result, and sends a link only when an eligible draft exists.
- The resume link is requested by the customer, not an abandonment reminder. Use a 15-minute, single-use token; store only its hash; keep contact data out of the URL; rotate it after use; and establish an `HttpOnly`, `Secure` in production, `SameSite=Lax` draft session cookie.
- Rate-limit requests and test with a fake local mail adapter. Production email may use Resend after h and h supplies a verified sending domain and API key.

### Retention Recommendation

This is a product recommendation to review with counsel before launch:

- Anonymous local snapshots: expire after 30 days.
- Identified unfinished drafts and their files: delete 180 days after last activity.
- Submitted briefs and files: retain 24 months after submission unless h and h deliberately retains or deletes them.
- Provide manual deletion in HHQ and a protected scheduled cleanup route for expired records and orphan objects.

## HHQ Contract

Add **Inquiries** to the authenticated HHQ navigation.

### Queue

- Plain table/list, responsive on phone.
- Name, contact, Draft/Submitted status, current zone or completion, last activity, and target location.
- Sort by last activity; filter by status; visually distinguish drafts without implying a lead score.
- Legacy inquiries remain visible.

### Detail

- Contact and manual follow-up disclosure state.
- All answers in tour order using readable labels.
- Private file actions and safe clickable links.
- Draft progress and timestamps.
- Mark Reviewed, mark Spam, and Delete with confirmation.
- No AI summary, visual house recreation, lead score, or complex dashboard.

## Accessibility Contract

- Meet WCAG 2.2 AA for the implemented flow.
- Use 44 × 44 CSS-pixel minimum interactive targets as the project standard.
- Use `fieldset`/`legend`, radios, checkboxes, buttons, labels, instructions, and errors with correct relationships.
- Move focus to the new prompt heading after a transition and announce zone/progress changes without repeating the entire scene.
- Support keyboard-only completion, Back, review editing, uploads, and priority assignment.
- Do not use hover, color, spatial position, motion, or drag as the only means of understanding or operating the experience.
- Preserve content and controls at 200% zoom and during mobile viewport changes.
- Slider-looking discrete ranges must remain discrete choice controls with exact labels.
- Keep validation next to the prompt and preserve answers when navigating backward.

## Analytics Contract

Measure funnel health without sending names, contact details, answers, filenames, or URLs:

- `plan_home_start`
- `zone_complete`
- `contact_checkpoint_saved`
- `draft_resumed`
- `reference_added`
- `plan_home_submitted`

Allowed properties are anonymous session ID, zone ID, prompt index, reference kind, device category, and non-PII source tags.

## Public Entry And Legal Copy

- Keep `/inquire` as the generic intake.
- Route the new-home single-family path from the website's project-start entry into `/plan-your-home`; preserve a clear choice for other project types.
- Update privacy copy before public cutover to cover local and server drafts, attachments, manual follow-up, customer-requested resume email, retention, and deletion.
- State near the budget question that it is planning context only, land is excluded, all features remain explorable, and no live estimate is being produced.
- State before submission that the brief starts a conversation and is not a design, price, feasibility decision, or contract.
- Legal and retention language requires h and h/counsel approval before public launch.

## Technical Research Basis

- Vercel documents a 4.5 MB request/response body limit for Vercel Functions and recommends direct-to-source uploads for larger files. That is why references upload directly to private Cloud Storage rather than passing through a server action: [Vercel body-size guidance](https://examples.vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
- Cloud Storage signed URLs provide time-limited upload or download access without making the bucket public: [Cloud Storage signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls).
- Firestore transactions are atomic and retry when concurrently edited documents change, supporting revision-safe room checkpoints: [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
- WCAG 2.2 AA's target-size minimum is 24 × 24 CSS pixels with spacing exceptions; the product deliberately adopts the stronger 44 × 44 enhanced target as its internal standard: [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) and [Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced).
- Resend has an official Next.js integration and can back the explicit resume-link adapter after domain/API setup; local and emulator proof uses a fake transport: [Resend with Next.js](https://resend.com/docs/send-with-nextjs).

## First-Version Non-Goals

- A generated or configurable floor plan.
- Photorealistic rendering, first-person 3D, or free movement.
- Room-by-room finish package selection.
- Live pricing, budget enforcement, financing qualification, or feasibility scoring.
- Automated abandoned-draft email or text campaigns.
- AI-generated summaries or lead scoring.
- Customer accounts or a persistent customer portal.
- Production deployment, DNS changes, or marketing launch as part of the local implementation goal.

## Final Acceptance Scenario

At 390 × 844 and desktop width, a reviewer can:

1. Enter a name and see it appear on the house plaque.
2. Answer the complete 35-question path through seven fixed illustrated zones.
3. Refresh mid-zone and resume at the exact prompt on the same device.
4. create an identified draft after question 6 and observe room checkpoints in HHQ.
5. Request and use a fake local resume email to continue from another browser context.
6. Add a PDF, an image, and an HTTPS link with notes; remove and replace a reference.
7. Edit earlier answers from review without losing later answers.
8. Submit once and see the corresponding HHQ record, answers, private files, and links.
9. Complete the same path by keyboard with reduced motion enabled.
10. Confirm the generic inquiry path still supports non-new-home work.

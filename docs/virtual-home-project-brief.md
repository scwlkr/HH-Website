# Virtual Home Project Brief

## Status

Brainstorming. No implementation is authorized yet.

This is the living discovery document for a future room-by-room inquiry experience. The current production behavior remains documented in [Inquiry flow](inquiry-flow.md).

## Working Idea

Evolve the existing `/inquire` project brief into a visual journey through a representative home. A customer would establish the broad shape of the project, move through a fixed sequence of rooms, make selections, attach inspiration, and submit one coherent brief for H&H to review before following up.

The illustrated home is an engaging way to navigate a long questionnaire. It does not generate or reconfigure a floor plan from the customer's answers. The experience should feel closer to walking through and describing a future home than filling out a conventional form.

The customer-facing experience is called **Plan Your Home**. The structured result sent to H&H remains a **project brief**.

## Desired Outcome

At the end of the experience:

- the customer feels that they have communicated the home they want
- H&H receives structured, room-level information that is useful before the first conversation
- H&H can distinguish requirements, preferences, open questions, and inspiration
- the customer sees a clear summary and can correct it before submitting
- the submission starts a design conversation; it does not promise a final plan, specification, price, or build commitment

## Existing Baseline

The current five-step project brief already collects:

- contact information and preferred contact method
- project type
- approximate total square footage
- overall finish level
- services needed
- project location and lot status
- timeline and optional budget range
- a freeform project description
- attribution data

The new concept should preserve useful parts of this contract while replacing the generic stepper experience with a more visual and detailed path for new-home inquiries. Other project types continue through a separate intake.

## Draft Experience Shape

This is a conversation starter, not an approved flow.

1. **Set the project frame** — Confirm the single-family new-home scope, custom-home intent, location, and lot status.
2. **Shape the home** — Approximate total square footage, stories, bedrooms, bathrooms, garage, and major must-have spaces.
3. **Add inspiration** — Upload plans or images and add links to websites, house plans, or reference projects.
4. **Walk through the home** — Follow the same illustrated room sequence as every other customer and make selections using visual choices, lists, checkboxes, and short answers.
5. **Set priorities** — Mark choices as must-have, preferred, optional, or undecided; identify where the customer wants to invest or simplify.
6. **Review the brief** — See the home program, selections, references, and unanswered items in one editable summary.
7. **Introduce yourself and submit** — Provide contact details, consent to follow-up, and send the project brief to H&H.

## Fixed Walkthrough

The walkthrough will use six to eight combined room zones and will not change based on the customer's answers. The exact zones and order are still unresolved. Navigation is intentionally linear: one room at a time, one obvious next action, a visible progress indicator, and a **Back** control for corrections.

- site and exterior
- entry and living areas
- kitchen and dining
- primary suite
- secondary bedrooms
- bathrooms
- laundry, mudroom, and storage
- garage and workshop
- outdoor living
- specialty-space questions such as an office, gym, media room, safe room, or guest suite

A customer selecting one bedroom sees the same rooms as a customer selecting five bedrooms. A bedroom scene represents the bedroom portion of the questionnaire rather than each literal bedroom in the proposed home. Every stop should still support **skip**, **not applicable**, or **not sure yet** where appropriate.

## Information Model

### Whole Project

- project path and requested H&H services
- location, lot status, and site context
- target total square-footage range
- number of stories
- bedroom and bathroom counts
- target timeline and investment range
- overall finish direction
- customer priorities and constraints

### Per Room Or Zone

- whether the room is needed
- approximate size or relative size preference
- key functions and features
- finish or fixture direction
- storage and adjacency needs
- accessibility or lifestyle considerations
- priority level
- notes and room-specific inspiration

### References

- uploaded plans and images
- links to websites, plans, listings, or inspiration boards
- a short note explaining what the customer likes about each reference

### Follow-Up

- contact details and preferred contact method
- customer-visible submission summary
- internal H&H review summary
- unanswered or contradictory selections worth discussing

## Product Guardrails To Test

- Keep it useful when a customer has only rough ideas.
- Never make a selection feel like a binding specification.
- Do not imply that visuals exactly represent the final material, layout, or price.
- Avoid presenting an automatic price as authoritative before site, design, and scope review.
- Let customers skip, go back, and revise without losing work.
- Keep a complete keyboard- and screen-reader-friendly form path alongside visual navigation.
- Make the experience practical on a phone, where many customers will first encounter it.
- Ask only questions that improve qualification or the first H&H conversation.

## Decisions To Resolve

1. Fixed room-zone set and sequence.
2. Selection depth: broad preferences versus detailed fixtures, finishes, dimensions, and brands.
3. Finish logic: one overall finish level, room-specific finish levels, or a base level with upgrades.
4. Square footage: customer-entered total only, room-by-room allocation, or guided range recommendations.
5. Budget behavior: private intake field, visible guidance, running range, or no calculated feedback.
6. Inspiration: allowed file types, upload limits, link handling, ownership language, and privacy.
7. Progress: anonymous session, autosave, email-based resume, account, or one-session completion.
8. H&H review: raw answers, generated summary, visual home map, lead scoring, and follow-up workflow.
9. Success criteria: completion rate, qualified leads, first-call preparedness, or another primary measure.

## Decision Log

### 2026-07-13 — Fixed illustrated walkthrough

- Use a guided illustrated home rather than a first-person 3D or photo-led experience.
- Every customer moves through the same visual rooms regardless of bedroom count, bathroom count, square footage, or other answers.
- The rooms organize and enliven a long questionnaire; they do not represent a generated floor plan.
- Customer answers do not add, remove, or visually reconfigure rooms.

### 2026-07-13 — New-home inquiries only

- The walkthrough is a dedicated intake experience for customers planning a new home.
- Remodels, additions, commercial work, land-only work, and other project types use a separate inquiry path.

### 2026-07-13 — Single-family working scope

- Treat detached single-family new homes as the working audience.
- A home may be fully custom or based on a more repeatable plan.
- The choice is provisional until planning is complete; townhome and multifamily projects remain outside the walkthrough unless deliberately added later.

### 2026-07-13 — Plan Your Home

- Use **Plan Your Home** as the customer-facing experience name and call to action.
- Describe the result as a **project brief** in supporting copy, the review screen, and H&H's internal workflow.
- Avoid language implying that the website produces final designs, specifications, or pricing.

### 2026-07-13 — Linear navigation

- Lead customers through one fixed room order with one obvious **Next** action.
- Keep **Back** available so answers can be corrected.
- Show clear progress and the current room so customers always know where they are.
- Do not use a free-roam house map during the questionnaire.

### 2026-07-13 — Six to eight combined zones

- Keep the walkthrough to six to eight visual stops.
- Group related rooms so the process does not become tedious.
- Keep each stop focused enough that it still feels like progressing through the home rather than completing a dense form page.

## Current Question

Which fixed route best matches the experience?

### A. Interior-first eight-stop route — recommended

1. **Living Room and Home Basics** — custom or plan-based, total square footage, stories, bedrooms, bathrooms, and how the household lives.
2. **Kitchen and Dining** — layout, pantry, appliances, entertaining, and finish direction.
3. **Primary Suite** — bedroom, bathroom, closet, privacy, and accessibility preferences.
4. **Bedrooms and Shared Bathrooms** — counts, sizes, guest or family use, and shared-bath expectations.
5. **Laundry, Mudroom, and Storage** — daily entry, utilities, organization, and storage needs.
6. **Garage, Exterior, and Site** — vehicles, workshop needs, exterior character, lot, and site considerations.
7. **Outdoor Living and Specialty Spaces** — porches, patios, pool, office, gym, media room, safe room, or other extras.
8. **Design Desk and Inspiration** — upload plans or images, add links, explain references, and capture final priorities.

The review, contact details, and submission follow the walkthrough and are not counted as room stops.

### B. Arrival-first eight-stop route

Start with the site, exterior, and front entry before moving into the living room. This feels more like physically arriving at a home, but delays the familiar square-footage and household questions.

### C. Essentials-only six-stop route

Combine the primary and secondary bedroom questions, combine utility spaces with the garage, and fold inspiration into the final review. This is shorter, but gives the most personal and practical areas less breathing room.

The recommendation is **A**. It begins exactly where the original idea began—the living room—then moves through the home in understandable groups. The final design desk gives uploads and references a natural home without interrupting the room questions.

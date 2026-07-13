# Virtual Home Project Brief

## Status

Brainstorming. No implementation is authorized yet.

This is the living discovery document for a future room-by-room inquiry experience. The current production behavior remains documented in [Inquiry flow](inquiry-flow.md).

## Working Idea

Evolve the existing `/inquire` project brief into a visual journey through a prospective home. A customer would establish the broad shape of the project, move through rooms, make selections, attach inspiration, and submit one coherent brief for H&H to review before following up.

The experience should feel closer to walking through and describing a future home than filling out a conventional form.

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

The new concept should preserve useful parts of this contract while replacing the generic stepper experience with a more visual and detailed residential path.

## Draft Experience Shape

This is a conversation starter, not an approved flow.

1. **Set the project frame** — New home, remodel, addition, or another path; custom-home intent; location and lot status.
2. **Shape the home** — Approximate total square footage, stories, bedrooms, bathrooms, garage, and major must-have spaces.
3. **Add inspiration** — Upload plans or images and add links to websites, house plans, or reference projects.
4. **Walk through the home** — Visit rooms or zones and make room-specific selections using visual choices, lists, checkboxes, and short answers.
5. **Set priorities** — Mark choices as must-have, preferred, optional, or undecided; identify where the customer wants to invest or simplify.
6. **Review the brief** — See the home program, selections, references, and unanswered items in one editable summary.
7. **Introduce yourself and submit** — Provide contact details, consent to follow-up, and send the project brief to H&H.

## Provisional Room Map

The exact map and order are unresolved.

- site and exterior
- entry and living areas
- kitchen and dining
- primary suite
- secondary bedrooms
- bathrooms
- laundry, mudroom, and storage
- garage and workshop
- outdoor living
- optional specialty spaces such as an office, gym, media room, safe room, or guest suite

Not every customer should be forced through every room. The home outline should determine which stops appear, and every stop should support **skip** or **not sure yet**.

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

1. Visual fidelity: illustrated room journey, photo-led tour, or navigable 3D environment.
2. Audience: custom new homes only, all new homes, or residential projects including remodels and additions.
3. Customer promise: project brief, home planner, design consultation starter, or another framing.
4. House structure: fixed room sequence, clickable floor plan, adaptive room list, or a hybrid.
5. Selection depth: broad preferences versus detailed fixtures, finishes, dimensions, and brands.
6. Finish logic: one overall finish level, room-specific finish levels, or a base level with upgrades.
7. Square footage: customer-entered total only, room-by-room allocation, or guided range recommendations.
8. Budget behavior: private intake field, visible guidance, running range, or no calculated feedback.
9. Inspiration: allowed file types, upload limits, link handling, ownership language, and privacy.
10. Progress: anonymous session, autosave, email-based resume, account, or one-session completion.
11. H&H review: raw answers, generated summary, visual home map, lead scoring, and follow-up workflow.
12. Success criteria: completion rate, qualified leads, first-call preparedness, or another primary measure.

## Decision Log

No decisions yet.

## Current Question

What should **virtual walkthrough** mean for the customer?

### A. Guided illustrated home — recommended starting point

The customer sees a stylized floor plan, dollhouse, or room scene, selects a room, and configures it in a panel. This can feel like touring a home while remaining understandable on mobile, accessible, and flexible as the question set changes.

### B. First-person 3D walkthrough

The customer moves through a rendered home like a game and makes selections in place. This is the most literal interpretation and the most immersive, but it assumes a house layout before the customer has designed one and creates a much larger experience and content burden.

### C. Photo-led room tour

The customer moves through curated H&H room photography or reference scenes and responds to what they see. This can feel authentic and approachable, but it is closer to a visual questionnaire than building or walking through their own home.

The recommendation is **A**, with enough visual continuity that the house appears to take shape as decisions are made. It preserves the emotional idea without requiring the experience to pretend that a real floor plan already exists.


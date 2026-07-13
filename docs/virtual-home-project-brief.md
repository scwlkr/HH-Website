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

## Custom-Home Intake Research

### Method

On 2026-07-13, ten public custom-home builder, residential designer, and architect intake experiences were reviewed qualitatively. The sample deliberately includes short lead forms, discovery briefs, and detailed pre-design questionnaires. This is a competitive benchmark, not a statistical census of the industry.

### Source Sample

| Source | Intake depth | Notable coverage |
| --- | --- | --- |
| [Fidelity Homes](https://www.fidelityhomes.ca/custom-home-questionnaire) | Short inquiry | Home type, square footage, bedrooms, bathrooms, custom versus existing plan, plan upload, budget, move-in timing, lot, servicing, restrictions, and meeting availability. |
| [ONE Custom Homes](https://www.onecustomhomes.com/our-process) | Consultation outline | Objectives, overall budget, property location and characteristics, square footage, bedroom and bathroom count, features, aesthetics, and a written follow-up summary. |
| [Premier Builders](https://mypremierbuilders.com/wp-content/uploads/2025/04/Forms.pdf) | Discovery brief | Daily life, current-home likes and dislikes, lot and views, space needs, entertaining, accessibility, inspiration, must-haves, budget, financing, timeline, involvement, and decision-makers. |
| [Black Rock Home Builders](https://www.blackrockhomebuilders.com/custom-home-questionnaire/) | Comprehensive pre-design | Site constraints, orientation, utilities, lifestyle, layout, adjacency, storage, accessibility, finishes, systems, outdoor living, budget priorities, future use, inspiration, must-haves, and deal-breakers. |
| [No Limit Homes](https://nolimitshomes.com/questionnaire/) | Detailed six-step form | Contact and household, plan readiness, size by floor, budget, land, style, high-priority rooms, exterior, garage, kitchen, laundry, living, dining, foyer, bedrooms, and finishes. It supports save and continue. |
| [L&M Custom Designs and Build](https://lmcustombuilds.com/forms/designer-questionnaire.pdf) | Room-program questionnaire | Household, site restrictions, style, square footage, room list, quantity, size, location, adjacency, kitchen, living, dining, bedrooms, baths, garage, and outdoor rooms. |
| [J Edwards Home Designs](https://www.jedwardshomedesigns.com/_files/ugd/0ccd6f_d9312643525d4d56aafe9c65a71c42e1.pdf) | Architectural questionnaire | Budget, household, site views, screening, trees, topography, setbacks, amenities, square footage, stories, bedrooms, bathrooms, garage bays, exterior materials, and room needs. |
| [Pippin Home Designs](https://www.pippinhomedesigns.com/wp-content/uploads/2025/01/Pippins-New-Home-Design-Questionnaire.pdf) | Deep design programming | Life goals, routines, future needs, property, views, desired feeling, accessibility, full room program, exterior style, detailed room features, storage, pets, systems, daylight, must-haves, and nice-to-haves. |
| [The Art of Architecture](https://theartofarchitecture.com/wp-content/uploads/2023/08/Lifestyle_Questionnaire-FILLABLE-1.pdf) | Deep lifestyle programming | Entertaining, room formality, room size, ceiling height, use, mood, orientation, adjacency, furniture, kitchen equipment, suites, utility areas, outdoor spaces, and special rooms. |
| [Primarc Studio](https://primarcstudio.com/residential-design-questionnaire/) | Comprehensive design intake | Site and plot, parking, privacy, room requirements, technology, sustainability, materials, landscape, time spent by space, specialty features, services, documents, timeline, and communication. |

### Recurring Information

The reviewed forms consistently separate broad project qualification from deeper design programming.

#### Core qualification

These appear in nearly every short inquiry and recur throughout the deeper questionnaires:

- contact details and preferred follow-up
- fully custom home versus an existing plan
- plan or inspiration upload when one exists
- lot ownership, location, servicing, and known restrictions
- target square footage, stories, bedrooms, bathrooms, and garage capacity
- approximate budget and desired start or move-in timing
- architectural or general style direction

#### Frequent discovery topics

These repeatedly appear once a company wants a useful design conversation rather than a basic sales lead:

- who will live in the home now and later
- daily routines, entertaining, working from home, hobbies, guests, children, and pets
- accessibility, multigenerational living, and aging-in-place needs
- what customers like and dislike about their current home
- open versus defined rooms, privacy, views, daylight, and desired mood
- must-have rooms, room relationships, storage, and future additions
- kitchen and dining behavior, primary-suite priorities, utility spaces, garage use, outdoor living, and specialty spaces
- must-haves, nice-to-haves, deal-breakers, and areas where the customer would invest or simplify
- inspiration photos, plans, websites, and notes explaining what is appealing

#### Deep pre-design details

The longest questionnaires also ask for exact room dimensions, furniture sizes, detailed adjacencies, appliance brands, hardware, plumbing fixtures, ceiling treatments, HVAC, wiring, energy systems, surveys, covenants, and financing details.

Those details are useful after a real project relationship begins, but most are too specific for an initial H&H inquiry. Asking them too early would make **Plan Your Home** feel like unpaid design work and increase abandonment.

### Research Direction For H&H

The strongest fit is a middle layer between the two market extremes:

- more useful than a ten-field lead form
- substantially lighter than a multi-page architectural programming document
- mostly quick visual choices with optional notes
- focused on decisions that improve qualification and the first conversation
- broad finish direction rather than exact brands, products, or specifications
- a clear result that separates requirements, preferences, unknowns, and inspiration

The existing eight-zone route remains a good working hypothesis. Research suggests adding whole-home systems and comfort preferences to the utility zone, keeping lot and site questions prominent, and treating lifestyle and future-use questions as equally important as room features.

## Draft Experience Shape

This is a conversation starter, not an approved flow.

1. **Welcome** — Confirm the single-family new-home scope and explain what the customer will produce.
2. **Walk through the home** — Follow the fixed illustrated room sequence using visual choices, lists, checkboxes, and short answers.
3. **Set priorities and add inspiration** — Separate must-haves from preferences, then upload plans or images and add useful links.
4. **Review the brief** — See the home program, selections, references, and unanswered items in one editable summary.
5. **Introduce yourself and submit** — Provide contact details, consent to follow-up, and send the project brief to H&H.

## Fixed Walkthrough

The walkthrough will use six to eight combined room zones and will not change based on the customer's answers. The following eight-stop route is a provisional starting point until the question inventory is settled:

1. **Living Room and Home Basics**
2. **Kitchen and Dining**
3. **Primary Suite**
4. **Bedrooms and Shared Bathrooms**
5. **Laundry, Mudroom, Storage, and Home Systems**
6. **Garage, Exterior, and Site**
7. **Outdoor Living and Specialty Spaces**
8. **Design Desk and Inspiration**

Navigation is intentionally linear: one room at a time, one obvious next action, a visible progress indicator, and a **Back** control for corrections.

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

1. Discovery depth and approximate question count.
2. Exact question inventory.
3. Final room-zone set and sequence.
4. Finish logic: one overall finish level, room-specific finish levels, or a base level with upgrades.
5. Square footage: customer-entered total only, room-by-room allocation, or guided range recommendations.
6. Budget behavior: private intake field, visible guidance, running range, or no calculated feedback.
7. Inspiration: allowed file types, upload limits, link handling, ownership language, and privacy.
8. Progress: anonymous session, autosave, email-based resume, account, or one-session completion.
9. H&H review: raw answers, generated summary, visual home map, lead scoring, and follow-up workflow.
10. Success criteria: completion rate, qualified leads, first-call preparedness, or another primary measure.

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

### 2026-07-13 — Provisional eight-stop route

- Use the interior-first eight-stop route as the general starting idea.
- Do not lock the room list until competitive research has informed the question inventory.
- Add, remove, or combine zones if the final questions reveal a better grouping.

## Current Question

How deep should **Plan Your Home** go?

### A. Qualification: roughly 12 to 18 decisions

Collect the essentials found on short builder forms: lot, size, bedrooms, bathrooms, garage, style, budget, timeline, plan status, inspiration, and contact. This is easy to finish but does not fully use the room-walkthrough concept.

### B. Balanced discovery: roughly 25 to 35 decisions — recommended

Add household and lifestyle, room function, storage, accessibility, outdoor living, priorities, and broad finish direction. Keep most questions tap-based, use conditional follow-ups, and leave exact specifications for a later design phase.

### C. Pre-design programming: 50 or more decisions

Capture detailed room sizes, adjacencies, materials, fixtures, systems, furniture, and technical preferences. This produces a richer architectural brief but risks turning the inquiry into the tedious form the experience is meant to avoid.

The recommendation is **B**. It matches H&H's goal: arrive at the first conversation informed, without pretending the customer has already completed design programming.

# Virtual Home Project Brief

## Status

Brainstorming. No implementation is authorized yet.

This is the living discovery document for a future room-by-room inquiry experience. The current production behavior remains documented in [Inquiry flow](inquiry-flow.md).

## Working Idea

Evolve the existing `/inquire` project brief into a visual journey through a representative home. A customer would establish the broad shape of the project, move through a fixed sequence of rooms, make selections, attach inspiration, and submit one coherent brief for H&H to review before following up.

The illustrated home is an engaging way to navigate a long questionnaire. It does not generate or reconfigure a floor plan from the customer's answers. Short room-to-room animations should turn, pan, or move through a doorway so the experience feels spatial rather than like unrelated form pages. The experience should feel closer to walking through and describing a future home than filling out a conventional form.

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

Navigation is intentionally linear: one room at a time, one obvious next action, a visible progress indicator, and a **Back** control for corrections. Moving forward or backward triggers a brief predesigned transition between the fixed room scenes.

A customer selecting one bedroom sees the same rooms as a customer selecting five bedrooms. A bedroom scene represents the bedroom portion of the questionnaire rather than each literal bedroom in the proposed home. Every stop should still support **skip**, **not applicable**, or **not sure yet** where appropriate.

The room scenes use dimensional architectural illustration: believable perspective and depth, restrained material cues, architectural linework, warm paper tones, and limited green emphasis. They should feel spatial and polished without becoming photorealistic promises or game-like 3D environments.

## Research-Informed Draft Question Inventory

This is a working inventory, not approved public copy. It contains 35 short question screens: the upper edge of the balanced-discovery target. Conditional details can reduce what an individual customer sees, but the eight visual zones remain fixed.

Most answers should use visual cards, checkboxes, ranges, or steppers. Free text is reserved for details that structured choices cannot capture.

### Welcome And Project Frame

| # | Working question | Likely response |
| --- | --- | --- |
| 1 | Where are you starting: fully custom, adapting a plan, bringing a completed plan, or not sure yet? | Choice cards |
| 2 | What is your lot status, and where are you building or hoping to build? | Lot-status choice plus location |
| 3 | What do you already know about the site? | Multi-select for slope, trees, views, water, utilities, well/septic, restrictions, or unknown |

### 1. Living Room And Home Basics

| # | Working question | Likely response |
| --- | --- | --- |
| 4 | What total heated square footage are you considering? | Range or number plus not sure |
| 5 | How many stories are you considering? | One, one-and-a-half, two, more, or not sure |
| 6 | How many bedrooms, full bathrooms, and half bathrooms do you expect? | Three compact steppers |
| 7 | Who should this home support now and over the next five to ten years? | Adults, children, extended family, frequent guests, pets, aging needs, or other |
| 8 | What parts of daily life should the home support especially well? | Gathering, quiet time, entertaining, remote work, hobbies, caregiving, accessibility, or other |
| 9 | How should the main living areas relate? | Open, partly open, more defined, or not sure |
| 10 | What matters most in the main living area? | Fireplace, television, built-ins, high ceilings, strong views, outdoor connection, flexible furniture, or other |
| 11 | Which of H&H's three finish levels fits the home as a whole? | Builder Grade, Builder+, Custom, or not sure |

### 2. Kitchen And Dining

| # | Working question | Likely response |
| --- | --- | --- |
| 12 | How will the kitchen be used most often? | Everyday cooking, serious cooking, family gathering, entertaining, catering, or mixed use |
| 13 | What kitchen arrangement sounds closest to what you want? | Island, double island, peninsula, no island, open to living, more separate, or not sure |
| 14 | What pantry or support space do you want? | Cabinet pantry, walk-in pantry, butler pantry, scullery/prep kitchen, none, or not sure |
| 15 | How should dining work in the home? | Island seating, breakfast area, open dining, formal dining, large-group hosting, or mixed use |

### 3. Primary Suite

| # | Working question | Likely response |
| --- | --- | --- |
| 16 | Where should the primary suite be located? | Main floor, upper floor, separate wing, no preference, or not sure |
| 17 | Which primary-bedroom features matter? | Sitting area, fireplace, outdoor access, morning bar, strong view, compact/simple, or other |
| 18 | Which primary-bath features matter? | Large shower, soaking tub, separate vanities, private toilet room, natural light, accessible design, or other |
| 19 | What closet, storage, and future-accessibility needs should the suite support? | Closet size/type, separate/shared, direct laundry access, aging-in-place, or other |

### 4. Bedrooms And Shared Bathrooms

| # | Working question | Likely response |
| --- | --- | --- |
| 20 | Who will use the secondary bedrooms, and should any be separated from the others? | Children, guests, multigenerational family, flexible use, grouped, split, or no preference |
| 21 | How should secondary bathrooms be shared? | Hall bath, Jack-and-Jill, private en suites, mixed approach, or not sure |

### 5. Laundry, Mudroom, Storage, And Home Systems

| # | Working question | Likely response |
| --- | --- | --- |
| 22 | Where and how should laundry work? | Near bedrooms, near primary suite, near mudroom, multiple locations, folding, sink, hanging, or other |
| 23 | What should the everyday entry or mudroom handle? | Shoes, coats, school bags, deliveries, pet gear, dog wash, freezer, charging, or other |
| 24 | What storage needs are easy to overlook but important to you? | Linens, seasonal items, sports, hobbies, food, cleaning, outdoor gear, bulk storage, or other |
| 25 | Which whole-home comfort or system priorities matter? | Energy efficiency, generator, all-electric, smart controls, security, audio, indoor-air quality, low maintenance, or other |

### 6. Garage, Exterior, And Site

| # | Working question | Likely response |
| --- | --- | --- |
| 26 | What should the garage accommodate? | Vehicle count, truck/SUV, EV charging, boat/RV, workshop, storage, detached/attached, or other |
| 27 | Which exterior character feels closest to the home you want? | Visual style cards plus materials loved or disliked |
| 28 | What site relationships matter most? | Views, morning/evening sun, privacy, street presence, trees, outdoor access, future structures, or not sure |

### 7. Outdoor Living And Specialty Spaces

| # | Working question | Likely response |
| --- | --- | --- |
| 29 | Which outdoor-living features matter? | Covered porch, screened porch, patio, outdoor kitchen, fireplace, pool, spa, garden, play area, or other |
| 30 | Which specialty spaces or future additions should be considered? | Office, gym, media room, game room, library, craft room, safe room, guest suite, ADU, workshop, or other |

### 8. Design Desk And Inspiration

| # | Working question | Likely response |
| --- | --- | --- |
| 31 | What do you like or dislike about your current home, and how should the new home feel different? | Mood cards plus two short optional prompts |
| 32 | What plans, images, websites, or homes best communicate your direction? | File uploads and repeatable links with a note for each |
| 33 | What are your must-haves, nice-to-haves, and deal-breakers? | Ranked or grouped priorities |
| 34 | What investment range and timing are you working toward, and where would you invest or simplify? | Budget range, timing choice, and priority areas |

### Review And Contact

| # | Working question | Likely response |
| --- | --- | --- |
| 35 | Who should H&H follow up with, and how? | Name, email, phone, preferred contact method, and consent |

### Question-Design Rules

- Keep all eight zones visible even when a conditional detail is not applicable.
- Offer **not sure yet** wherever a customer may reasonably need H&H's guidance.
- Allow optional notes without making customers type after every choice.
- Ask for requirements and preferences, not final specifications.
- Use plain homeowner language and explain unfamiliar terms such as scullery or Jack-and-Jill bath.
- Keep exact brands, model numbers, fixture schedules, and technical documents out of the initial inquiry.
- Treat the selected finish level as a whole-home package; room questions capture desired features, not package overrides.

## Information Model

### Whole Project

- project path and requested H&H services
- location, lot status, and site context
- target total square-footage range
- number of stories
- bedroom and bathroom counts
- target timeline and investment range
- one of H&H's three whole-home finish levels
- customer priorities and constraints

### Per Room Or Zone

- whether the room is needed
- approximate size or relative size preference
- key functions and features
- desired features within the selected whole-home finish level
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
- Keep transitions short, preserve answers during movement, and honor reduced-motion preferences with an immediate alternative.
- Keep a complete keyboard- and screen-reader-friendly form path alongside visual navigation.
- Make the experience practical on a phone, where many customers will first encounter it.
- Ask only questions that improve qualification or the first H&H conversation.

## Decisions To Resolve

1. Relationship between the room scene and question controls, including mobile behavior.
2. Transition storyboards and the illustrated asset plan.
3. Refine and approve the exact question inventory.
4. Final room-zone set and sequence.
5. Square footage: customer-entered total only, room-by-room allocation, or guided range recommendations.
6. Budget behavior: private intake field, visible guidance, running range, or no calculated feedback.
7. Inspiration: allowed file types, upload limits, link handling, ownership language, and privacy.
8. Progress: anonymous session, autosave, email-based resume, account, or one-session completion.
9. H&H review: raw answers, generated summary, visual home map, lead scoring, and follow-up workflow.
10. Animation implementation technique, chosen later based on assets, performance, and maintainability.
11. Success criteria: completion rate, qualified leads, first-call preparedness, or another primary measure.

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

### 2026-07-13 — Balanced discovery depth

- Target roughly 25 to 35 short decision screens.
- Use structured visual choices for most answers, with optional notes and conditional detail.
- Capture enough context to prepare H&H for the first conversation without drifting into detailed architectural programming.

### 2026-07-13 — One whole-home finish level

- Offer the three existing finish levels: Builder Grade, Builder+, and Custom.
- The selected finish level applies to the entire home.
- Do not ask customers to upgrade, downgrade, or mix finish packages by room.
- Room questions capture functional features and priorities within the chosen whole-home package.

### 2026-07-13 — Animated room-to-room movement

- Each step should feel connected to the previous one through a brief turn, pan, or doorway movement.
- Use fixed, predesigned transitions; answers do not generate a different house or alter the route.
- The motion exists to sustain the feeling of walking through and planning a home, not as decoration between form pages.
- Defer the technical choice until implementation planning. Remotion is a candidate, not a commitment; the simplest performant approach should win.
- Provide an immediate reduced-motion path without changing the questions or progress.

### 2026-07-13 — Dimensional architectural illustration

- Use illustrated room scenes with believable perspective and depth.
- Carry the site's warm architectural paper, restrained linework, near-black ink, and limited green emphasis into the walkthrough.
- Use material and furniture cues to make each zone legible without presenting a photorealistic final design.
- Build scenes in layers that can support simple pans, pivots, or doorway transitions.
- Avoid both photorealistic renders and game-like 3D presentation.

## Current Question

How should the questions coexist with each room scene?

### A. Room-dominant split layout — recommended

Keep the illustrated room as the dominant surface and place one focused question panel beside it. On mobile, keep a compact room view above a bottom question card. The room remains visible while the customer answers.

### B. Hotspots inside the room

Place clickable markers on objects and areas in the illustration. This feels more game-like, but important questions become easier to miss and harder to use with a keyboard, screen reader, or small phone.

### C. Full room followed by a separate form screen

Show the scene and transition first, then replace it with a conventional full-width question page. This is simple, but the walkthrough feeling disappears while customers make their selections.

The recommendation is **A**. It keeps the home present without hiding questions or sacrificing clarity. The scene supplies emotion and context; the dedicated panel keeps the interaction simple and intuitive.

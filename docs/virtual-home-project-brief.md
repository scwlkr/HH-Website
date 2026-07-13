# Virtual Home Project Brief

## Status

Discovery complete. The refined implementation contract is [Plan Your Home product specification](plan-your-home-product-spec.md), and its sequenced delivery plan is [Plan Your Home implementation roadmap](plan-your-home-implementation-roadmap.md).

This document preserves the research and decision history. Where working copy, ranges, or unresolved details below differ from the product specification, the product specification controls. The current production behavior remains documented in [Inquiry flow](inquiry-flow.md).

## Working Idea

Evolve the existing `/inquire` project brief into a visual journey through a representative home. A customer would establish the broad shape of the project, move through a fixed sequence of rooms, make selections, attach inspiration, and submit one coherent brief for h and h to review before following up.

The illustrated home is an engaging way to navigate a long questionnaire. It does not generate or reconfigure a floor plan from the customer's answers. Short room-to-room animations should turn, pan, or move through a doorway so the experience feels spatial rather than like unrelated form pages. The experience should feel closer to walking through and describing a future home than filling out a conventional form.

The customer-facing experience is called **Plan Your Home**. The structured result sent to h and h remains a **project brief**.

The phone is the canonical design and testing viewport. The room illustration automatically pans or zooms to frame the active object and opens a touch-sized prompt within that area. Desktop presents the same interaction in a wider horizontal stage rather than introducing a separate desktop form layout. Predominantly mobile usage is a working product assumption to validate after launch, not a confirmed measurement.

## Desired Outcome

At the end of the experience:

- the customer feels that they have communicated the home they want
- h and h receives structured, room-level information that is useful before the first conversation
- h and h can distinguish requirements, preferences, open questions, and inspiration
- the customer sees a clear summary and can correct it before submitting
- the submission starts a design conversation; it does not promise a final plan, specification, price, or build commitment

The primary success test is whether h and h can enter the first customer meeting with enough context to ask informed design and fit questions instead of repeating basic intake. Completion, abandonment, and identifiable-draft conversion are supporting health metrics rather than the main goal.

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

Those details are useful after a real project relationship begins, but most are too specific for an initial h and h inquiry. Asking them too early would make **Plan Your Home** feel like unpaid design work and increase abandonment.

### Research Direction For h and h

The strongest fit is a middle layer between the two market extremes:

- more useful than a ten-field lead form
- substantially lighter than a multi-page architectural programming document
- mostly quick visual choices with optional notes
- focused on decisions that improve qualification and the first conversation
- broad finish direction rather than exact brands, products, or specifications
- a clear result that separates requirements, preferences, unknowns, and inspiration

The seven-zone route remains the working hypothesis. Research supports adding whole-home systems and comfort preferences to the utility zone, keeping lot and site questions prominent, and treating lifestyle and future-use questions as equally important as room features.

### Square-Footage Bracket Check

The [2025 U.S. Census Characteristics of New Housing](https://www.census.gov/construction/chars/highlights.html) reports a 2,142-square-foot median for completed new single-family homes and 2,194 square feet for new single-family homes sold. [Houseplans.com's size collections](https://www.houseplans.com/collection/sizes) use familiar 500-square-foot bands from 1,000 through 2,999 square feet, then broader large-home categories. This supports finer choices around the common middle and wider choices above 3,000 square feet.

For this walkthrough, **heated square footage** means finished conditioned living area; it excludes garages, carports, porches, and unfinished space, consistent with the practical distinction in the [Census floor-area definition](https://www.census.gov/construction/soc/definitions.html).

## Draft Experience Shape

This is a conversation starter, not an approved flow.

1. **Personalized welcome** — Ask only for the customer's name, then type it onto the illustrated home's address plaque or nameplate so the walkthrough immediately feels like their home.
2. **Home basics** — Complete the first room's broad home questions without another identity form.
3. **Save progress** — Ask for email and phone after question 6, explain that they can resume later and h and h may personally follow up about the project, then sync the first backend draft without sending an automatic reminder.
4. **Walk through the home** — Continue through the fixed illustrated room sequence using visual choices, lists, checkboxes, and short answers, syncing after every room.
5. **Set priorities and add inspiration** — Separate must-haves from preferences, then upload plans or images and add useful links.
6. **Review and submit** — See one editable summary, confirm follow-up preferences and consent, and send the project brief to h and h.

## Fixed Walkthrough

The walkthrough will use the following seven combined zones and will not change based on the customer's answers:

1. **Living Room and Home Basics**
2. **Kitchen and Dining**
3. **Primary Suite**
4. **Bedrooms and Shared Bathrooms**
5. **Laundry, Mudroom, Storage, and Home Systems**
6. **Garage, Exterior, Site, Outdoor Living, and Specialty Spaces**
7. **Design Desk and Inspiration**

Navigation is intentionally linear: one room at a time, one obvious next action, a visible progress indicator, and a **Back** control for corrections. Moving forward or backward triggers a brief predesigned transition between the fixed room scenes.

A customer selecting one bedroom sees the same rooms as a customer selecting five bedrooms. A bedroom scene represents the bedroom portion of the questionnaire rather than each literal bedroom in the proposed home. Each structured prompt must be acknowledged, using **not applicable**, **none**, or **not sure yet** where appropriate instead of a silent skip.

The room scenes use dimensional architectural illustration: believable perspective and depth, restrained material cues, architectural linework, warm paper tones, and limited green emphasis. They should feel spatial and polished without becoming photorealistic promises or game-like 3D environments.

Questions and answer controls are integrated into the illustrated room rather than placed in a permanent form panel. One prompt at a time attaches to a relevant object, fixture, surface, or area and expands in place when active. After the answer is recorded, attention moves to the next integrated prompt. The room itself is the interface; it should not look like a decorative image sitting beside a form.

On a phone, the scene automatically frames the current object or area so the illustration, label, and answer targets remain understandable and easy to touch. Customers should not have to rotate their phone. On desktop, the same scene and interaction model expand into a wide horizontal presentation; desktop does not become a different questionnaire.

## Research-Informed Draft Question Inventory

This is a working inventory, not approved public copy. It contains 35 short question interactions: the upper edge of the balanced-discovery target. Conditional details can reduce what an individual customer sees, but the seven visual zones remain fixed.

Most answers should use visual cards, checkboxes, ranges, or steppers that appear as part of the active room scene. Free text is reserved for details that structured choices cannot capture.

### Welcome And Project Frame

Before the numbered planning questions, ask **Customer name** only. As the customer types, render the name onto the illustrated home's address plaque or nameplate. This is personalization, not a full lead gate.

| # | Working question | Likely response |
| --- | --- | --- |
| 1 | Where are you starting: fully custom, adapting a plan, bringing a completed plan, or not sure yet? | Choice cards |
| 2 | What is your lot status, and where are you building or hoping to build? | Lot-status choice plus location |
| 3 | What do you already know about the site? | Multi-select for slope, trees, views, water, utilities, well/septic, restrictions, or unknown |

### 1. Living Room And Home Basics

| # | Working question | Likely response |
| --- | --- | --- |
| 4 | What total heated square footage are you considering? | Stepped range: under 1,000; 1,000–1,499; 1,500–1,999; 2,000–2,499; 2,500–2,999; 3,000–3,999; 4,000–4,999; 5,000+; or not sure yet |
| 5 | How many stories are you considering? | One, one-and-a-half, two, more, or not sure |
| 6 | How many bedrooms, full bathrooms, and half bathrooms do you expect? | Three compact steppers |
| 7 | Who should this home support now and over the next five to ten years? | Adults, children, extended family, frequent guests, pets, aging needs, or other |
| 8 | What parts of daily life should the home support especially well? | Gathering, quiet time, entertaining, remote work, hobbies, caregiving, accessibility, or other |
| 9 | How should the main living areas relate? | Open, partly open, more defined, or not sure |
| 10 | What matters most in the main living area? | Fireplace, television, built-ins, high ceilings, strong views, outdoor connection, flexible furniture, or other |
| 11 | Which of h and h's three finish levels fits the home as a whole? | Builder Grade, Builder+, Custom, or not sure |

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

### 6. Garage, Exterior, Site, Outdoor Living, And Specialty Spaces

| # | Working question | Likely response |
| --- | --- | --- |
| 26 | What should the garage accommodate? | Vehicle count, truck/SUV, EV charging, boat/RV, workshop, storage, detached/attached, or other |
| 27 | Which exterior character feels closest to the home you want? | Visual style cards plus materials loved or disliked |
| 28 | What site relationships matter most? | Views, morning/evening sun, privacy, street presence, trees, outdoor access, future structures, or not sure |
| 29 | Which outdoor-living features matter? | Covered porch, screened porch, patio, outdoor kitchen, fireplace, pool, spa, garden, play area, or other |
| 30 | Which specialty spaces or future additions should be considered? | Office, gym, media room, game room, library, craft room, safe room, guest suite, ADU, workshop, or other |

### 7. Design Desk And Inspiration

| # | Working question | Likely response |
| --- | --- | --- |
| 31 | What do you like or dislike about your current home, and how should the new home feel different? | Mood cards plus two short optional prompts |
| 32 | What plans, images, websites, or homes best communicate your direction? | File uploads and repeatable links with a note for each |
| 33 | What are your must-haves, nice-to-haves, and deal-breakers? | Ranked or grouped priorities |
| 34 | What home-design-and-construction budget range and timing are you currently planning around? | Stepped budget range plus timing choice |

Use this final illustrated zone as the single reference workspace. Accept house-plan PDFs, phone images, and repeatable website links, with a short optional note on each item explaining what the customer likes. Do not place upload controls throughout the earlier rooms.

### Review And Contact

| # | Working question | Likely response |
| --- | --- | --- |
| 35 | How should h and h follow up once you submit this project brief? | Preferred contact method and consent; name, email, and phone are already present |

### Save-Progress Checkpoint

After question 6, once the customer has established the home's broad size and bedroom/bathroom count, ask for email and phone with direct value-based copy such as: **Save your progress and resume later.** Clearly disclose that h and h may personally follow up about the project. When completed, silently sync the customer's name, answers so far, and contact details as the first identifiable backend draft; do not automatically send a reminder. This checkpoint is separate from the 35 planning decisions above.

### Question-Design Rules

- Keep all seven zones visible even when a conditional detail is not applicable.
- Integrate prompts with relevant room objects or areas instead of exposing a separate form column.
- Guide customers through one active prompt at a time; do not display a field of competing hotspots.
- Offer **not sure yet** wherever a customer may reasonably need h and h's guidance.
- Require every structured prompt to be acknowledged; use explicit **none** or **not applicable** choices when relevant rather than leaving ambiguous blanks.
- Allow optional notes without making customers type after every choice.
- Ask for requirements and preferences, not final specifications.
- Use plain homeowner language and explain unfamiliar terms such as scullery or Jack-and-Jill bath.
- Keep exact brands, model numbers, fixture schedules, and technical documents out of the initial inquiry.
- Treat the selected finish level as a whole-home package; room questions capture desired features, not package overrides.

## Information Model

### Whole Project

- project path and requested h and h services
- location, lot status, and site context
- target total square-footage range
- number of stories
- bedroom and bathroom counts
- target timeline and investment range
- one of h and h's three whole-home finish levels
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
- internal h and h review summary
- unanswered or contradictory selections worth discussing

### HHQ Review

Add a simple inquiry list to HHQ with customer name, contact details, **draft** or **submitted** status, progress, and last activity. Opening a record shows every answer in the same basic order the customer encountered it, followed by uploaded files and clickable reference links. Keep the view clean and literal: no visual house recreation, generated narrative, lead score, or elaborate dashboard is required.

## Product Guardrails To Test

- Keep it useful when a customer has only rough ideas.
- Never make a selection feel like a binding specification.
- Do not imply that visuals exactly represent the final material, layout, or price.
- Avoid presenting an automatic price as authoritative before site, design, and scope review.
- Keep every home feature available regardless of the customer's stated budget; reconcile scope and budget with h and h during the later in-person design conversation.
- Let customers choose an explicit uncertainty response, go back, and revise without losing work.
- Autosave each answer locally, sync a server draft after every completed room, and return a resumed customer to their last position.
- Show unfinished room-by-room drafts in h and h's backend without treating them as completed submissions.
- Send no automatic abandoned-draft reminder; allow disclosed, manual h and h follow-up.
- Ensure every integrated prompt remains a real semantic control with a clear label, focus state, and ordered keyboard path.
- Keep transitions short, preserve answers during movement, and honor reduced-motion preferences with an immediate alternative.
- Keep a complete keyboard- and screen-reader-friendly form path alongside visual navigation.
- Design and test the phone experience first, including touch target size, text legibility, viewport changes, and one-handed use.
- Do not require landscape orientation or depend on hover.
- Treat desktop as a wider rendering of the same guided experience, not a separate form layout.
- Ask only questions that improve qualification or the first h and h conversation.

## Resolved Implementation Planning

The product specification now owns the exact 35-question registry, seven-zone storyboard, hybrid architecture, semantic-control model, CSS/WAAPI motion, upload limits and security, draft retention recommendation, requested resume-email flow, privacy requirements, HHQ contract, and final browser acceptance scenario.

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
- Describe the result as a **project brief** in supporting copy, the review screen, and h and h's internal workflow.
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

- Target roughly 25 to 35 short decision interactions.
- Use structured visual choices for most answers, with optional notes and conditional detail.
- Capture enough context to prepare h and h for the first conversation without drifting into detailed architectural programming.

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

### 2026-07-13 — Questions integrated into the room

- The illustrated room is the interaction surface, not a background beside a visible form.
- Attach each prompt to a relevant object, fixture, surface, or spatial area whenever possible.
- Let the active question and its choices expand within the scene, then settle back into the room when answered.
- Do not use a permanent split-screen question panel.
- Preserve semantic controls, readable labels, keyboard order, and screen-reader access underneath the visual treatment.

### 2026-07-13 — One guided prompt at a time

- Show and emphasize only the current integrated prompt.
- After an answer is recorded, move attention to the next object or area in a predetermined order.
- Keep progress explicit so customers know how much remains in the room and the overall walkthrough.
- Do not show every hotspot at once or require customers to discover hidden interactions.

### 2026-07-13 — Mobile-first single experience

- Treat the phone as the canonical design and testing viewport.
- Automatically pan or zoom each room scene to frame the active object and its touch-sized prompt.
- Do not require landscape orientation.
- Present the same interaction in a wider horizontal stage on desktop rather than creating a separate desktop form layout.
- Treat predominantly mobile use as a working assumption and validate the actual device mix after launch.

### 2026-07-13 — Layered draft saving and resume

- Autosave every answer locally without requiring an account or contact information.
- Return the customer to the exact prompt they left when the same browser resumes the walkthrough.
- Include a visible **Resume a saved plan** action that can send a secure, customer-requested email link.
- Allow the link to resume across devices without creating an account.
- Use the retention and resume-link rules in the product specification, subject to legal review before launch.

### 2026-07-13 — Room-by-room backend drafts

- Continue saving each answer locally so an interrupted question does not disappear.
- After every completed room, sync the accumulated answers to a server-side draft.
- Show the unfinished draft, completed rooms, current position, answers so far, and last activity time in h and h's backend.
- On the same device, resume the exact prompt from local progress; on another device, resume immediately after the last room synced to the server.
- Keep **draft** and **submitted inquiry** as distinct statuses; completing a room does not imply that the customer submitted the project brief.
- Create the first identifiable server draft after question 6 when the customer provides email and phone at the save-progress checkpoint.

### 2026-07-13 — Budget is planning context only

- Ask what home-design-and-construction budget the customer is currently planning around; treat the response as directional and exclude land from the range.
- Use the product-spec bands: **Under $300K**, **$300K–$499K**, **$500K–$749K**, **$750K–$999K**, **$1M–$1.49M**, **$1.5M–$2.49M**, **$2.5M+**, and **Not sure yet**.
- Present the bands as one simple stepped selector or equivalent single-choice control.
- Do not calculate, display, update, or warn about pricing while the customer plans the home.
- Do not hide, disable, or discourage features based on the selected range.
- Let the customer describe the home they want; h and h will align the design and budget during a later in-person meeting.

### 2026-07-13 — Personalized welcome and earned contact checkpoint

- Ask only for **Customer name** on the welcome screen.
- Animate the entered name onto the illustrated home's address plaque or nameplate so the home immediately feels personal.
- Keep progress local while the customer completes the first room.
- After question 6, ask for email and phone with a clear **Save your progress and resume later** explanation.
- Once contact details are provided, sync the name, answers so far, and contact details as the first identifiable backend draft; sync again after each completed zone.
- Collect the preferred follow-up method and final submission confirmation at the end; separately explain the possibility of manual h and h contact at the save-progress checkpoint.

### 2026-07-13 — Silent draft saving with manual follow-up

- Do not automatically email or text a resume reminder when an identifiable draft becomes inactive.
- Keep the unfinished draft and its progress visible in h and h's backend.
- Allow a member of the h and h team to follow up manually using the saved email or phone number.
- Disclose at the save-progress checkpoint that h and h may use the contact details to personally follow up about the project; do not imply they are used only for technical draft storage.
- Let returning customers initiate resume from the site using a secure recovery flow; settle its exact verification method during implementation planning.

### 2026-07-13 — One whole-home square-footage range

- Ask for one approximate total heated-square-footage range; do not ask customers to allocate square footage by room.
- Define heated square footage as finished conditioned living area, excluding garages, carports, porches, and unfinished spaces.
- Use these research-aligned steps: **Under 1,000**, **1,000–1,499**, **1,500–1,999**, **2,000–2,499**, **2,500–2,999**, **3,000–3,999**, **4,000–4,999**, **5,000+**, and **Not sure yet**.
- Present the choice as a simple stepped mobile control with a clearly displayed selected range; retain an equivalent semantic form control for accessibility.
- Treat the answer as directional planning context, not a generated floor plan or constraint on later feature choices.

### 2026-07-13 — One Design Desk for inspiration

- Collect all plans, photos, and website references in the illustrated **Design Desk and Inspiration** zone near the end.
- Accept house-plan PDFs, phone images, and repeatable website links as the working content types.
- Allow a short optional note on each reference so h and h knows what the customer likes or wants to discuss.
- Do not interrupt earlier rooms with upload controls.
- Keep all inspiration optional; a customer with no files or links should continue without friction.
- Use the exact formats, limits, private-storage rules, and link-security behavior in the product specification.

### 2026-07-13 — Plain HHQ inquiry records

- Add a basic HHQ inquiry list for both unfinished drafts and submitted project briefs.
- Show customer name, contact information, status, progress, and last activity in a clean scannable list.
- Open each inquiry as a plain record containing all customer answers in walkthrough order.
- Make uploaded files directly openable and website references clickable from the record.
- Do not add a customer-facing house visualization, AI-generated summary, lead scoring, or complex analytics to the HHQ review screen.

### 2026-07-13 — No silently skipped planning prompts

- Require a response to each structured planning prompt before moving forward.
- Include **Not sure yet**, **None**, or **Not applicable** wherever those are honest possible answers.
- Keep optional notes, uploads, and inspiration links optional.
- Preserve **Back** and revision controls so acknowledgment does not make an answer feel permanent.
- Store explicit uncertainty separately from missing or invalid data so h and h can understand the customer's actual level of clarity.

### 2026-07-13 — Seven-zone working route

- Use seven visual stops as the working route.
- Merge **Garage, Exterior, and Site** with **Outdoor Living and Specialty Spaces** into one combined exterior-oriented zone.
- Keep the primary suite and secondary bedroom/shared-bath zones separate.
- Preserve all existing questions; the merge removes one transition rather than removing intake content.
- Treat this as the settled planning direction unless prototyping later reveals a clear pacing problem.

### 2026-07-13 — First-meeting preparedness is the primary outcome

- Judge the experience primarily by whether h and h can start the first meeting with informed design and project-fit questions instead of repeating basic intake.
- Use a lightweight internal review after early real inquiries to learn whether the brief was useful, what h and h still had to re-ask, and which answers created noise.
- Track completion rate, abandonment by zone, identifiable-draft-to-submission conversion, and completion time as supporting health metrics.
- Do not maximize form completion or early contact capture at the expense of the information h and h needs for a productive conversation.

## Brainstorming Checkpoint

The product direction and implementation planning are complete. Use the product specification for behavior and the roadmap for issue slicing and proof. The discovery notes above remain useful evidence, not a second implementation contract.

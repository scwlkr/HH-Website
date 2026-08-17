# Owner feedback loop

Use fake names, contact details, addresses, project information, plans, and links
only. Never capture customer details, real addresses, private plans, uploads,
resume links, tokens, or admin information in screenshots or notes.

1. Open the page being reviewed. For Plan Your Home, use the unlinked
   `/plan-your-home/review` URL and reset it when a clean walkthrough is needed.
   Its header Back and Next controls are review-only shortcuts: they browse
   screens without requiring answers and never change the customer route.
2. Walk naturally on the phone. When friction appears, take a screenshot without
   leaving the flow; collect rough notes and keep moving.
3. Upload the screenshot batch and notes to Codex after the session.
4. Codex maps ordinary pages by route, viewport, and visible heading or control
   text. For Plan Your Home, Codex can also use the existing stable zone and
   prompt IDs in the page.
5. Codex creates one bounded GitHub issue per coherent fix. Implement each later
   with `$implement <full issue URL>`.

GitHub Issues remain the durable work record. Do not create an in-site comment
database, annotation overlay, reviewer account, or separate feedback register.

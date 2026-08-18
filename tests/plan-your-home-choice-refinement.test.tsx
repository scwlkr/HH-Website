import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlanYourHomeShell } from "../features/plan-your-home/plan-your-home-shell.tsx";
import { createPlanHomeRefinementFixture } from "../features/plan-your-home/refinement-fixture.ts";
import { normalizeLegacyPlanHomeAnswers } from "../features/plan-your-home/schemas.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderQuestion(state: "q3" | "q10" | "q13" | "q16" | "q17" | "q29") {
  const view = render(
    <PlanYourHomeShell
      refinementFixture={createPlanHomeRefinementFixture(state)}
      reducedMotion
    />,
  );
  return { view, query: within(view.container) };
}

test("Q3 renders independent well and septic choices that may both be selected", async () => {
  const user = userEvent.setup({ document: window.document });
  const { query } = renderQuestion("q3");

  assert.equal(query.queryByRole("checkbox", { name: "Well or septic" }), null);
  const well = query.getByRole("checkbox", { name: "Well water" });
  const septic = query.getByRole("checkbox", { name: "Septic system" });
  await user.click(well);
  await user.click(septic);
  assert.equal((well as HTMLInputElement).checked, true);
  assert.equal((septic as HTMLInputElement).checked, true);
});

test("Q10 renders exactly the three approved required finish directions", () => {
  const { query } = renderQuestion("q10");

  assert.equal(query.queryByRole("textbox"), null);
  assert.equal(query.queryByText("Not sure yet"), null);
  assert.deepEqual(
    query.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ["builder-grade", "builder-plus", "custom"],
  );
  assert.ok(query.getByText("Builder"));
  assert.ok(query.getByText("Builder+"));
  assert.ok(query.getByText("Custom"));
  assert.ok(
    query.getByText(
      "Budget-conscious finishes selected from a fixed standard palette. Prioritizes dependable, affordable materials with no fixture, finish, or trim customization.",
    ),
  );
  assert.ok(
    query.getByText(
      "Mid-grade finishes balancing affordability with greater choice. Offers upgraded materials and more flexibility to modify fixtures, finishes, and trim.",
    ),
  );
  assert.ok(
    query.getByText(
      "Premium, fully personalized finish direction. Supports top-tier materials, custom fixtures, millwork, trim, and one-of-a-kind details.",
    ),
  );
});

test("Q13, Q16, and Q17 render only their revised current choices", () => {
  let rendered = renderQuestion("q13");
  assert.equal(rendered.query.queryByRole("checkbox", { name: "None" }), null);
  assert.ok(rendered.query.getByRole("checkbox", { name: "Not sure yet" }));
  rendered.view.unmount();

  rendered = renderQuestion("q16");
  assert.equal(
    rendered.query.queryByRole("checkbox", {
      name: "Curbless or accessible layout",
    }),
    null,
  );
  rendered.view.unmount();

  rendered = renderQuestion("q17");
  assert.equal(
    rendered.query.queryByRole("checkbox", { name: "Accessible clearances" }),
    null,
  );
  assert.equal(rendered.query.queryByRole("checkbox", { name: "None" }), null);
  assert.ok(rendered.query.getByRole("checkbox", { name: "Not sure yet" }));
});

test("Q29 opens Nice-to-haves first and presents every visible priority order consistently", () => {
  const { query } = renderQuestion("q29");
  const categories = within(
    query.getByRole("group", { name: "Priority group to edit" }),
  ).getAllByRole("button");

  assert.deepEqual(
    categories.map((button) => button.textContent?.replace(/\s+/g, " ").trim()),
    ["Nice-to-haves0 / 5", "Must-haves0 / 5", "Deal-breakers0 / 3"],
  );
  assert.equal(categories[0]?.getAttribute("aria-pressed"), "true");
  assert.equal(
    query.getByText(/Up to 5 nice-to-haves/).textContent,
    "Choose a group, then choose features with keyboard or touch. Up to 5 nice-to-haves, 5 must-haves, and 3 deal-breakers.",
  );
  assert.ok(query.getByText("Choose nice-to-haves"));
});

test("legacy answers remain reviewable and exact-answer edits replace only their question", async () => {
  const user = userEvent.setup({ document: window.document });
  const fixture = createPlanHomeRefinementFixture("review");
  const previousFinish = "Warm natural wood, stone, and hand-finished trim";
  const legacyAnswers = normalizeLegacyPlanHomeAnswers({
    ...fixture.state.answers,
    "project.site-context": ["wooded", "well-or-septic"],
    "home.finish-level": previousFinish,
    "kitchen.support": ["none"],
    "primary.bath-features": ["curbless-or-accessible-layout"],
    "primary.closet-access": ["accessible-clearances"],
  });
  const view = render(
    <PlanYourHomeShell
      refinementFixture={{
        ...fixture,
        state: { ...fixture.state, answers: legacyAnswers },
      }}
      reducedMotion
    />,
  );
  const query = within(view.container);

  assert.ok(query.getByText("Wooded, Well or septic (previous answer)"));
  assert.ok(query.getByText(`Previously saved: ${previousFinish}`));
  assert.ok(query.getByText("None (previous answer)"));
  assert.ok(query.getByText("Curbless or accessible layout (previous answer)"));
  assert.ok(query.getByText("Accessible clearances (previous answer)"));

  await user.click(
    query.getByRole("button", {
      name: "Edit Q10: What finish direction do you have in mind?",
    }),
  );
  assert.ok(
    query.getByText(
      `Previously saved: ${previousFinish}. Choose a current option only if you want to replace it.`,
    ),
  );
  assert.equal(query.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked), true);
  await user.click(query.getByRole("radio", { name: /Custom/ }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await waitFor(() => assert.ok(query.getByText("Custom")));
  assert.equal(query.queryByText(`Previously saved: ${previousFinish}`), null);
  assert.ok(query.getByText("One"));

  await user.click(
    query.getByRole("button", {
      name: "Edit Q3: What do you know about the site?",
    }),
  );
  assert.ok(
    query.getByText(
      "Previously saved: Well or septic (previous answer). Choose current options only if you want to replace them.",
    ),
  );
  assert.equal(
    (query.getByRole("checkbox", { name: "Wooded" }) as HTMLInputElement)
      .checked,
    true,
  );
  await user.click(query.getByRole("checkbox", { name: "Well water" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await waitFor(() => assert.ok(query.getByText("Wooded, Well water")));
  assert.equal(query.queryByText(/Well or septic \(previous answer\)/), null);
  assert.ok(query.getByText("Custom"));
  assert.ok(query.getByText("One"));
});

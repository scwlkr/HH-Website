import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";

import {
  PlanYourHomeShell,
  type PlanHomeDraftAction,
} from "../features/plan-your-home/plan-your-home-shell.tsx";
import { PLAN_HOME_LOCAL_SNAPSHOT_KEY } from "../features/plan-your-home/local-snapshot.ts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const draftId = `draft-${"a".repeat(40)}`;

function successfulCreate(calls: unknown[]): PlanHomeDraftAction {
  return async (input) => {
    calls.push(input);
    return {
      status: "success",
      result: { draftId, revision: 1, applied: true },
    };
  };
}

function successfulCheckpoint(calls: unknown[]): PlanHomeDraftAction {
  return async (input) => {
    calls.push(input);
    return {
      status: "success",
      result: { draftId, revision: 2, applied: true },
    };
  };
}

function observeScrollIntoView() {
  const targets: Element[] = [];
  const original = window.HTMLElement.prototype.scrollIntoView;
  window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
    targets.push(this);
  };
  return {
    targets,
    restore() {
      window.HTMLElement.prototype.scrollIntoView = original;
    },
  };
}

async function beginTour(
  user: ReturnType<typeof userEvent.setup>,
  query: ReturnType<typeof within>,
) {
  const name = query.getByRole("textbox", { name: "Your name" });
  await user.type(name, "Taylor Homeowner");
  assert.equal(
    query.getByText("Taylor Homeowner").closest('[aria-hidden="true"]') !== null,
    true,
  );
  await user.click(query.getByRole("button", { name: "Open the front door" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Where are you starting?",
      }),
    ),
  );
  assert.equal(
    window.document.activeElement,
    query.getByRole("heading", {
      name: "Where are you starting?",
    }),
  );
}

async function answerThroughContactGate(
  user: ReturnType<typeof userEvent.setup>,
  query: ReturnType<typeof within>,
) {
  await beginTour(user, query);

  await user.click(query.getByRole("radio", { name: "Fully custom" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.click(query.getByRole("checkbox", { name: "Architectural design" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await user.click(query.getByRole("radio", { name: "Own it" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  await user.type(
    query.getByRole("textbox", { name: "City, county, address, or target area" }),
    "Denton County",
  );
  await user.click(query.getByRole("button", { name: "Next" }));

  await user.click(query.getByRole("checkbox", { name: "Wooded" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await user.click(query.getByRole("radio", { name: "2,000–2,499" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await user.click(query.getByRole("radio", { name: "One" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  const bedrooms = query.getByRole("group", { name: "Bedrooms" });
  await user.click(within(bedrooms).getByRole("radio", { name: "4" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  const fullBathrooms = query.getByRole("group", { name: "Full bathrooms" });
  await user.click(within(fullBathrooms).getByRole("radio", { name: "3" }));
  await user.click(query.getByRole("button", { name: "Continue" }));
  const halfBathrooms = query.getByRole("group", { name: "Half bathrooms" });
  await user.click(within(halfBathrooms).getByRole("radio", { name: "1" }));
  await user.click(query.getByRole("button", { name: "Next" }));

  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Save your progress and resume later.",
      }),
    ),
  );
  assert.equal(
    window.document.activeElement,
    query.getByRole("heading", {
      name: "Save your progress and resume later.",
    }),
  );
}

async function saveContact(
  user: ReturnType<typeof userEvent.setup>,
  query: ReturnType<typeof within>,
) {
  await user.type(query.getByRole("textbox", { name: "Email" }), "Taylor@Example.com");
  await user.type(query.getByRole("textbox", { name: "Phone" }), "+1 214 555 0100");
  await user.click(
    query.getByRole("checkbox", {
      name: /Save my progress\. h and h may personally follow up/,
    }),
  );
  await user.click(query.getByRole("button", { name: "Save and continue" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Who should this home support over time?",
      }),
    ),
  );
  assert.equal(
    window.document.activeElement,
    query.getByRole("heading", {
      name: "Who should this home support over time?",
    }),
  );
}

test("welcome personalizes decorative plaque and the front-door beat opens exact question 1", async () => {
  const user = userEvent.setup({ document: window.document });
  const view = render(<PlanYourHomeShell reducedMotion />);
  const query = within(view.container);

  assert.equal(query.getAllByRole("heading", { level: 1 }).length, 1);
  assert.ok(query.getByRole("link", { name: "Save and exit" }));
  await waitFor(() =>
    assert.ok(query.getByText("An illustrated walkthrough, not a proposed design")),
  );
  assert.equal(
    query.getByText("An illustrated walkthrough, not a proposed design").closest(
      '[aria-hidden="true"]',
    ) !== null,
    true,
  );
  await beginTour(user, query);
  assert.ok(query.getByRole("link", { name: "Save and exit" }));
  assert.equal(query.getByRole("progressbar").getAttribute("value"), "1");
  await waitFor(() =>
    assert.equal(
      view.container
        .querySelector('[data-scene-anchor="rolled-plans"]')
        ?.getAttribute("data-active"),
      "true",
    ),
  );
});

test("missing grouped choices use one safe instruction per group and refocus as answers change", async () => {
  const user = userEvent.setup({ document: window.document });
  const view = render(<PlanYourHomeShell reducedMotion />);
  const query = within(view.container);
  const scroll = observeScrollIntoView();

  try {
    await beginTour(user, query);
    const startingPoint = query.getByRole("group", { name: "Starting point" });
    assert.equal(query.queryByRole("group", { name: "Services" }), null);
    await user.click(query.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      assert.deepEqual(
        query.getAllByRole("alert").map((alert) => alert.textContent),
        ["Choose a starting point."],
      );
      assert.equal(
        window.document.activeElement,
        within(startingPoint).getAllByRole("radio")[0],
      );
    });
    assert.equal(scroll.targets.at(-1), startingPoint);
    assert.equal(query.queryByText(/Invalid option:/), null);

    await user.click(
      within(startingPoint).getByRole("radio", { name: "Fully custom" }),
    );
    await user.click(query.getByRole("button", { name: "Continue" }));
    const services = query.getByRole("group", { name: "Services" });
    await user.click(query.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      assert.deepEqual(
        query.getAllByRole("alert").map((alert) => alert.textContent),
        ["Choose at least one service."],
      );
      assert.equal(
        window.document.activeElement,
        within(services).getAllByRole("checkbox")[0],
      );
    });
    assert.equal(scroll.targets.at(-1), services);
    assert.match(
      query.getByRole("group", { name: "Completed Starting point" })
        .textContent ?? "",
      /Fully custom/,
    );

    await user.click(
      within(services).getByRole("checkbox", { name: "Architectural design" }),
    );
    await user.click(query.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      assert.ok(
        query.getByRole("heading", {
          name: "What is your lot status and location?",
        }),
      ),
    );
    const lotStatus = query.getByRole("group", { name: "Lot status" });
    assert.equal(
      query.queryByRole("textbox", {
        name: "City, county, address, or target area",
      }),
      null,
    );
    await user.click(query.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      assert.deepEqual(
        query.getAllByRole("alert").map((alert) => alert.textContent),
        ["Choose a lot status."],
      );
      assert.equal(
        window.document.activeElement,
        within(lotStatus).getAllByRole("radio")[0],
      );
    });
    assert.equal(scroll.targets.at(-1), lotStatus);

    await user.click(query.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      assert.ok(
        query.getByRole("heading", {
          name: "Where are you starting?",
        }),
      ),
    );
    await user.click(query.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      assert.ok(
        query.getByRole("heading", {
          name: "What is your lot status and location?",
        }),
      ),
    );
    assert.equal(query.queryByRole("alert"), null);
  } finally {
    scroll.restore();
  }
});

test("missing bedroom and bathroom counts show customer-safe guidance and focus the first incomplete group", async () => {
  const user = userEvent.setup({ document: window.document });
  const view = render(<PlanYourHomeShell reducedMotion />);
  const query = within(view.container);
  const scroll = observeScrollIntoView();

  try {
    await beginTour(user, query);
    await user.click(query.getByRole("radio", { name: "Fully custom" }));
    await user.click(query.getByRole("button", { name: "Continue" }));
    await user.click(
      query.getByRole("checkbox", { name: "Architectural design" }),
    );
    await user.click(query.getByRole("button", { name: "Next" }));
    await user.click(query.getByRole("radio", { name: "Own it" }));
    await user.click(query.getByRole("button", { name: "Continue" }));
    await user.type(
      query.getByRole("textbox", {
        name: "City, county, address, or target area",
      }),
      "Denton County",
    );
    await user.click(query.getByRole("button", { name: "Next" }));
    await user.click(query.getByRole("checkbox", { name: "Wooded" }));
    await user.click(query.getByRole("button", { name: "Next" }));
    await user.click(query.getByRole("radio", { name: "2,000–2,499" }));
    await user.click(query.getByRole("button", { name: "Next" }));
    await user.click(query.getByRole("radio", { name: "One" }));
    await user.click(query.getByRole("button", { name: "Next" }));

    const bedrooms = query.getByRole("group", { name: "Bedrooms" });
    assert.equal(query.queryByRole("group", { name: "Full bathrooms" }), null);
    await user.click(query.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      assert.deepEqual(
        query.getAllByRole("alert").map((alert) => alert.textContent),
        ["Choose a bedroom count."],
      );
      assert.equal(
        window.document.activeElement,
        within(bedrooms).getAllByRole("radio")[0],
      );
    });
    assert.equal(query.queryByText(/Invalid option:/), null);
    assert.equal(scroll.targets.at(-1), bedrooms);

    await user.click(within(bedrooms).getByRole("radio", { name: "4" }));
    await user.click(query.getByRole("button", { name: "Continue" }));
    const fullBathrooms = query.getByRole("group", { name: "Full bathrooms" });
    await user.click(query.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      assert.deepEqual(
        query.getAllByRole("alert").map((alert) => alert.textContent),
        ["Choose a full-bathroom count."],
      );
      assert.equal(
        window.document.activeElement,
        within(fullBathrooms).getAllByRole("radio")[0],
      );
    });
    assert.equal(scroll.targets.at(-1), fullBathrooms);
    assert.match(
      query.getByRole("group", { name: "Completed Bedrooms" }).textContent ?? "",
      /Bedrooms4Edit/,
    );
    const accessibility = await axe.run(view.container, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.deepEqual(
      accessibility.violations.map((violation) => violation.id),
      [],
    );
  } finally {
    scroll.restore();
  }
});

test("valid choices persist locally before Next and survive refresh without a server write", async () => {
  const createCalls: unknown[] = [];
  const user = userEvent.setup({ document: window.document });
  const firstView = render(
    <PlanYourHomeShell
      createDraft={successfulCreate(createCalls)}
      reducedMotion
    />,
  );
  const firstQuery = within(firstView.container);

  await beginTour(user, firstQuery);
  await user.click(firstQuery.getByRole("radio", { name: "Fully custom" }));
  await user.click(firstQuery.getByRole("button", { name: "Continue" }));
  await user.click(
    firstQuery.getByRole("checkbox", { name: "Architectural design" }),
  );

  await waitFor(() => {
    const snapshot = JSON.parse(
      window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) ?? "null",
    );
    assert.deepEqual(snapshot.answers["project.starting-services"], {
      startingPoint: "fully-custom",
      services: ["architectural-design"],
    });
  });
  assert.equal(createCalls.length, 0);

  firstView.unmount();
  const refreshedView = render(
    <PlanYourHomeShell
      createDraft={successfulCreate(createCalls)}
      reducedMotion
    />,
  );
  const refreshed = within(refreshedView.container);
  await waitFor(() =>
    assert.ok(
      refreshed.getByRole("heading", {
        name: "Where are you starting?",
      }),
    ),
  );
  assert.match(
    refreshed.getByRole("group", { name: "Completed Starting point" })
      .textContent ?? "",
    /Fully custom/,
  );
  assert.equal(
    (
      refreshed.getByRole("checkbox", {
        name: "Architectural design",
      }) as HTMLInputElement
    ).checked,
    true,
  );
  assert.equal(createCalls.length, 0);
});

test("valid text persists after a debounce, on blur, and on navigation", async () => {
  const createCalls: unknown[] = [];
  const user = userEvent.setup({ document: window.document });
  const firstView = render(
    <PlanYourHomeShell
      createDraft={successfulCreate(createCalls)}
      reducedMotion
    />,
  );
  const firstQuery = within(firstView.container);

  await beginTour(user, firstQuery);
  await user.click(firstQuery.getByRole("radio", { name: "Fully custom" }));
  await user.click(firstQuery.getByRole("button", { name: "Continue" }));
  await user.click(
    firstQuery.getByRole("checkbox", { name: "Architectural design" }),
  );
  await user.click(firstQuery.getByRole("button", { name: "Next" }));
  await user.click(firstQuery.getByRole("radio", { name: "Own it" }));
  await user.click(firstQuery.getByRole("button", { name: "Continue" }));
  const location = firstQuery.getByRole("textbox", {
    name: "City, county, address, or target area",
  });
  await user.type(location, "Denton County");

  await waitFor(
    () => {
      const snapshot = JSON.parse(
        window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) ?? "null",
      );
      assert.equal(
        snapshot.answers["project.lot-location"].location,
        "Denton County",
      );
    },
    { timeout: 1_000 },
  );
  assert.equal(createCalls.length, 0);

  await user.clear(location);
  await user.type(location, "Pilot Point");
  await user.tab();
  await waitFor(() => {
    const snapshot = JSON.parse(
      window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) ?? "null",
    );
    assert.equal(
      snapshot.answers["project.lot-location"].location,
      "Pilot Point",
    );
  });

  firstView.unmount();
  const refreshedView = render(
    <PlanYourHomeShell
      createDraft={successfulCreate(createCalls)}
      reducedMotion
    />,
  );
  const refreshed = within(refreshedView.container);
  await waitFor(() =>
    assert.equal(
      (
        refreshed.getByRole("textbox", {
          name: "City, county, address, or target area",
        }) as HTMLInputElement
      ).value,
      "Pilot Point",
    ),
  );

  const refreshedLocation = refreshed.getByRole("textbox", {
    name: "City, county, address, or target area",
  });
  await user.clear(refreshedLocation);
  await user.type(refreshedLocation, "Argyle");
  await user.click(refreshed.getByRole("button", { name: "Next" }));
  await waitFor(() => {
    const snapshot = JSON.parse(
      window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) ?? "null",
    );
    assert.equal(snapshot.answers["project.lot-location"].location, "Argyle");
    assert.equal(snapshot.progress.location.questionId, "project.site-context");
  });
  assert.equal(createCalls.length, 0);
});

test("no server write occurs before contact and valid contact creates exactly question 1-6", async () => {
  const createCalls: unknown[] = [];
  const user = userEvent.setup({ document: window.document });
  const view = render(
    <PlanYourHomeShell
      createDraft={successfulCreate(createCalls)}
      reducedMotion
    />,
  );
  const query = within(view.container);

  await answerThroughContactGate(user, query);
  assert.equal(createCalls.length, 0);
  await saveContact(user, query);
  assert.equal(createCalls.length, 1);

  const input = createCalls[0] as {
    welcomeName: string;
    answers: Record<string, unknown>;
    contact: Record<string, unknown>;
  };
  assert.equal(input.welcomeName, "Taylor Homeowner");
  assert.equal(Object.keys(input.answers).length, 6);
  assert.deepEqual(Object.keys(input.answers), [
    "project.starting-services",
    "project.lot-location",
    "project.site-context",
    "home.heated-square-feet",
    "home.stories",
    "home.bed-bath-counts",
  ]);
  assert.equal(input.contact.manualFollowUpDisclosureAccepted, true);
});

test("contact validation stays customer-safe, retains answers, and retries one stable create key", async () => {
  const calls: Array<{ idempotencyKey: string }> = [];
  const createDraft: PlanHomeDraftAction = async (input) => {
    calls.push(input as { idempotencyKey: string });
    if (calls.length === 1) {
      return {
        status: "validation-error",
        message: "Invalid option: expected one of schema.enum.values",
      };
    }
    return {
      status: "success",
      result: { draftId, revision: 1, applied: false },
    };
  };
  const user = userEvent.setup({ document: window.document });
  const view = render(<PlanYourHomeShell createDraft={createDraft} reducedMotion />);
  const query = within(view.container);

  await answerThroughContactGate(user, query);
  await user.type(query.getByRole("textbox", { name: "Email" }), "taylor@example.com");
  await user.type(query.getByRole("textbox", { name: "Phone" }), "2145550100");
  await user.click(query.getByRole("checkbox", { name: /Save my progress/ }));
  await user.click(query.getByRole("button", { name: "Save and continue" }));
  await waitFor(() => {
    assert.equal(
      query.getByRole("alert").textContent,
      "Some answers need attention. Review them and try again.",
    );
    assert.equal(query.queryByText(/Invalid option/), null);
  });

  const snapshot = JSON.parse(
    window.localStorage.getItem(PLAN_HOME_LOCAL_SNAPSHOT_KEY) ?? "null",
  );
  assert.equal(Object.keys(snapshot.answers).length, 6);
  assert.equal(
    (query.getByRole("textbox", { name: "Email" }) as HTMLInputElement).value,
    "taylor@example.com",
  );

  await user.click(query.getByRole("button", { name: "Save and continue" }));
  await waitFor(() => assert.equal(calls.length, 2));
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
});

test("refresh restores before and after contact; question 11 checkpoints all first-zone answers", async () => {
  const createCalls: unknown[] = [];
  const checkpointCalls: unknown[] = [];
  const createDraft = successfulCreate(createCalls);
  const checkpointDraft = successfulCheckpoint(checkpointCalls);
  const user = userEvent.setup({ document: window.document });
  const firstView = render(
    <PlanYourHomeShell
      createDraft={createDraft}
      checkpointDraft={checkpointDraft}
      reducedMotion
    />,
  );
  const firstQuery = within(firstView.container);

  await answerThroughContactGate(user, firstQuery);
  firstView.unmount();

  const contactView = render(
    <PlanYourHomeShell
      createDraft={createDraft}
      checkpointDraft={checkpointDraft}
      reducedMotion
    />,
  );
  const contactQuery = within(contactView.container);
  await waitFor(() =>
    assert.ok(
      contactQuery.getByRole("heading", {
        name: "Save your progress and resume later.",
      }),
    ),
  );
  await saveContact(user, contactQuery);
  contactView.unmount();

  const resumedView = render(
    <PlanYourHomeShell
      createDraft={createDraft}
      checkpointDraft={checkpointDraft}
      reducedMotion
    />,
  );
  const resumed = within(resumedView.container);
  await waitFor(() =>
    assert.ok(
      resumed.getByRole("heading", {
        name: "Who should this home support over time?",
      }),
    ),
  );

  await user.click(resumed.getByRole("checkbox", { name: "Growing family" }));
  await user.click(resumed.getByRole("button", { name: "Next" }));
  await user.click(resumed.getByRole("checkbox", { name: "Gathering" }));
  await user.click(resumed.getByRole("button", { name: "Next" }));
  await user.click(resumed.getByRole("radio", { name: "Open" }));
  await user.click(resumed.getByRole("button", { name: "Next" }));
  await user.click(resumed.getByRole("checkbox", { name: "Fireplace" }));
  await user.click(resumed.getByRole("button", { name: "Next" }));
  await user.click(resumed.getByRole("radio", { name: "Builder Grade" }));
  await user.click(resumed.getByRole("button", { name: "Save room" }));

  await waitFor(() =>
    assert.ok(
      resumed.getByRole("heading", {
        name: "How will you use the kitchen?",
      }),
    ),
  );
  assert.equal(checkpointCalls.length, 1);
  const checkpoint = checkpointCalls[0] as {
    expectedRevision: number;
    completedZoneId: string;
    answers: Record<string, unknown>;
  };
  assert.equal(checkpoint.expectedRevision, 1);
  assert.equal(checkpoint.completedZoneId, "project-and-living");
  assert.equal(Object.keys(checkpoint.answers).length, 11);
});

test("contact checkpoint has no detectable automated accessibility violations", async () => {
  const user = userEvent.setup({ document: window.document });
  const view = render(<PlanYourHomeShell reducedMotion />);
  const query = within(view.container);
  await answerThroughContactGate(user, query);

  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );
});

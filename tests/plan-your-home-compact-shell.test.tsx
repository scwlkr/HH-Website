import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PlanYourHomeShell } from "../features/plan-your-home/plan-your-home-shell.tsx";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

test("question chrome keeps visual progress compact and exposes the count accessibly", async () => {
  const user = userEvent.setup({ document: window.document });
  const view = render(<PlanYourHomeShell reducedMotion />);
  const query = within(view.container);

  await user.type(query.getByRole("textbox", { name: "Your name" }), "Taylor");
  await user.click(query.getByRole("button", { name: "Open the front door" }));
  await waitFor(() =>
    assert.ok(
      query.getByRole("heading", {
        name: "Where are you starting, and what help are you looking for?",
      }),
    ),
  );

  const header = view.container.querySelector("header");
  const stage = view.container.querySelector(
    '[data-question-id="project.starting-services"]',
  );
  assert.ok(header);
  assert.ok(stage);

  const progress = stage.querySelector("progress");
  const progressCopy = progress?.previousElementSibling;
  const promptSheet = stage.querySelector(
    '[aria-labelledby="project.starting-services-heading"]',
  );
  const promptHeader = promptSheet?.firstElementChild;
  assert.ok(progress);
  assert.ok(progressCopy);
  assert.ok(promptSheet);
  assert.ok(promptHeader);

  assert.equal(header.textContent?.includes("Question 1 of 35"), false);
  assert.equal(progressCopy.textContent?.trim(), "Entry and Living Room");
  assert.notEqual(promptHeader.firstElementChild?.tagName, "SPAN");
  assert.equal(progress.getAttribute("aria-label"), "Question 1 of 35");
  assert.equal(progress.getAttribute("value"), "1");
  assert.equal(progress.getAttribute("max"), "35");
  assert.ok(query.getByRole("link", { name: "Save and exit" }));
});

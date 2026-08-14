import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React, { useState } from "react";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import {
  ChoicePrompt,
  CountPrompt,
  GroupedChoicePrompt,
  MultiChoicePrompt,
  PriorityPrompt,
  ReferencesPrompt,
  ShortTextPrompt,
} from "../features/plan-your-home/prompt-renderers.tsx";
import { SceneStage } from "../features/plan-your-home/scene-stage.tsx";
import { PlanYourHomeShell } from "../features/plan-your-home/plan-your-home-shell.tsx";
import {
  getPlanHomeQuestion,
  planHomeQuestions,
  planHomeZones,
} from "../features/plan-your-home/registry.ts";

afterEach(() => cleanup());

const basicOptions = [
  { slug: "first", label: "First choice" },
  { slug: "second", label: "Second choice" },
  { slug: "third", label: "Third choice" },
  { slug: "not-sure-yet", label: "Not sure yet", semantic: "uncertain" as const },
];

function requireQuestion(id: string) {
  const question = getPlanHomeQuestion(id);
  if (!question) {
    throw new Error(`Missing test question ${id}.`);
  }
  return question;
}

test("choice renderer exposes a named radio group and keyboard state", async () => {
  function Harness() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <ChoicePrompt
        id="choice"
        legend="Choose one direction"
        instructions="One response is required."
        options={basicOptions}
        value={value}
        onChange={setValue}
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  const first = query.getByRole("radio", { name: "First choice" });
  const second = query.getByRole("radio", { name: "Second choice" });

  await user.tab();
  assert.equal(window.document.activeElement, first);
  await user.keyboard("{ArrowDown}");
  assert.equal((second as HTMLInputElement).checked, true);
  assert.equal(second, window.document.activeElement);
  assert.match(
    query.getByRole("group", { name: "Choose one direction" }).getAttribute(
      "aria-describedby",
    ) ?? "",
    /instructions/,
  );
});

test("multi-choice renderer enforces limits and exclusive choices", async () => {
  function Harness() {
    const [value, setValue] = useState<readonly string[]>([]);
    return (
      <MultiChoicePrompt
        id="multi"
        legend="Choose daily-life priorities"
        options={basicOptions}
        value={value}
        maxSelections={2}
        exclusiveOptionSlugs={["not-sure-yet"]}
        onChange={setValue}
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  await user.click(query.getByRole("checkbox", { name: "First choice" }));
  await user.click(query.getByRole("checkbox", { name: "Second choice" }));
  await user.click(query.getByRole("checkbox", { name: "Third choice" }));
  assert.equal(query.getByRole("alert").textContent, "Choose no more than 2 options.");
  assert.equal(
    query.getByRole("group", { name: "Choose daily-life priorities" }).getAttribute(
      "aria-invalid",
    ),
    "true",
  );
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));

  assert.equal(
    (query.getByRole("checkbox", {
      name: "Not sure yet",
    }) as HTMLInputElement).checked,
    true,
  );
  assert.equal(
    (query.getByRole("checkbox", {
      name: "First choice",
    }) as HTMLInputElement).checked,
    false,
  );
});

test("grouped renderer stages one editable answer group at a time", async () => {
  function Harness() {
    const [value, setValue] = useState({
      workCenter: null as string | null,
      services: [] as readonly string[],
    });
    return (
      <GroupedChoicePrompt
        id="grouped"
        groups={[
          { id: "workCenter", label: "Work center", options: basicOptions },
          {
            id: "services",
            label: "Services",
            options: basicOptions,
            maxSelections: 2,
            exclusiveOptionSlugs: ["not-sure-yet"],
          },
        ]}
        value={value}
        instructions="Choose one response in each group."
        onChange={(next) =>
          setValue(next as typeof value)
        }
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  assert.ok(query.getByRole("group", { name: "Work center" }));
  assert.equal(query.queryByRole("group", { name: "Services" }), null);

  await user.click(query.getByRole("radio", { name: "First choice" }));
  await user.click(query.getByRole("button", { name: "Continue" }));

  assert.match(
    query.getByRole("group", { name: "Completed Work center" }).textContent ?? "",
    /Work centerFirst choiceEdit/,
  );
  assert.ok(query.getByRole("button", { name: "Edit Work center" }));
  assert.equal(query.queryByRole("group", { name: "Work center" }), null);
  assert.ok(query.getByRole("group", { name: "Services" }));

  await user.click(query.getByRole("checkbox", { name: "Second choice" }));
  assert.equal(
    (query.getByRole("checkbox", {
      name: "Second choice",
    }) as HTMLInputElement).checked,
    true,
  );

  await user.click(query.getByRole("button", { name: "Edit Work center" }));
  assert.equal(query.queryByRole("group", { name: "Services" }), null);
  assert.equal(
    (query.getByRole("radio", { name: "First choice" }) as HTMLInputElement)
      .checked,
    true,
  );
  await user.click(query.getByRole("button", { name: "Done" }));
  assert.equal(
    (query.getByRole("checkbox", { name: "Second choice" }) as HTMLInputElement)
      .checked,
    true,
  );
});

test("short text renderer labels optional input, error, count, and uncertainty", async () => {
  function Harness() {
    const [value, setValue] = useState("Denton");
    const [uncertain, setUncertain] = useState(false);
    return (
      <ShortTextPrompt
        id="location"
        legend="Location"
        label="Target area"
        instructions="City or county is enough."
        error="Use at least two characters."
        value={value}
        maxLength={160}
        optional
        uncertainLabel="Not sure yet"
        uncertain={uncertain}
        onUncertainChange={setUncertain}
        onChange={setValue}
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  const input = query.getByRole("textbox", { name: /Target area/ });
  assert.match(input.getAttribute("aria-describedby") ?? "", /instructions/);
  assert.match(input.getAttribute("aria-describedby") ?? "", /error/);
  assert.equal(query.getByRole("alert").textContent, "Use at least two characters.");
  await user.click(query.getByRole("checkbox", { name: "Not sure yet" }));
  assert.equal((input as HTMLInputElement).value, "");
  assert.equal((input as HTMLInputElement).disabled, true);
  assert.equal(query.getByText("0 of 160 characters").getAttribute("aria-live"), "polite");
});

test("count renderer stages each required count and keeps summaries editable", async () => {
  const question = requireQuestion("home.bed-bath-counts");

  function Harness() {
    const [value, setValue] = useState<Record<string, string | null>>({
      bedrooms: null,
      fullBathrooms: null,
      halfBathrooms: null,
    });
    return (
      <CountPrompt
        id="counts"
        groups={question.response.optionGroups}
        value={value}
        instructions="Choose one exact range for each count."
        onChange={setValue}
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  const bedrooms = query.getByRole("group", { name: "Bedrooms" });
  assert.equal(query.queryByRole("group", { name: "Full bathrooms" }), null);
  assert.match(
    view.container.querySelector(
      `#${bedrooms.getAttribute("aria-describedby")}`,
    )?.textContent ?? "",
    /Choose one exact range for each count\./,
  );
  await user.click(within(bedrooms).getByRole("radio", { name: "4" }));
  await user.click(query.getByRole("button", { name: "Continue" }));

  const fullBathrooms = query.getByRole("group", { name: "Full bathrooms" });
  assert.equal(query.queryByRole("group", { name: "Half bathrooms" }), null);
  assert.match(
    query.getByRole("group", { name: "Completed Bedrooms" }).textContent ?? "",
    /Bedrooms4Edit/,
  );
  await user.click(within(fullBathrooms).getByRole("radio", { name: "3" }));
  await user.click(query.getByRole("button", { name: "Continue" }));

  const halfBathrooms = query.getByRole("group", { name: "Half bathrooms" });
  await user.click(within(halfBathrooms).getByRole("radio", { name: "1" }));
  assert.equal(
    (within(halfBathrooms).getByRole("radio", {
      name: "1",
    }) as HTMLInputElement).checked,
    true,
  );

  await user.click(query.getByRole("button", { name: "Edit Bedrooms" }));
  assert.equal(query.queryByRole("group", { name: "Half bathrooms" }), null);
  assert.equal(
    (query.getByRole("radio", { name: "4" }) as HTMLInputElement).checked,
    true,
  );
});

test("priority renderer progressively assigns groups with buttons and reports limits", async () => {
  function Harness() {
    const [value, setValue] = useState({
      mustHave: [] as readonly string[],
      niceToHave: [] as readonly string[],
      dealBreakers: [] as readonly string[],
      customItem: null as Readonly<{
        label: string;
        priority: "must-have" | "nice-to-have" | "deal-breaker";
      }> | null,
      noStrongPrioritiesYet: false,
    });
    return (
      <>
        <PriorityPrompt
          id="priorities"
          legend="Priority assignment"
          items={["Outdoor connection", "Accessible clearances"]}
          value={value}
          limits={{ mustHave: 1, niceToHave: 1, dealBreaker: 1 }}
          onChange={setValue}
        />
        <output aria-label="Serialized priority answer">
          {JSON.stringify(value)}
        </output>
      </>
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  assert.equal(query.queryAllByRole("combobox").length, 0);
  assert.ok(
    query.getByRole("group", { name: "Priority group to edit" }),
  );
  const outdoorConnection = query.getByRole("button", {
    name: "Outdoor connection: Not assigned",
  });
  outdoorConnection.focus();
  await user.keyboard(" ");
  assert.match(
    query.getByLabelText("Serialized priority answer").textContent ?? "",
    /"mustHave":\["Outdoor connection"\]/,
  );
  await user.click(
    query.getByRole("button", {
      name: "Accessible clearances: Not assigned",
    }),
  );
  assert.equal(query.getByRole("alert").textContent, "Must-have limit reached.");

  const niceToHaves = query.getByRole("button", {
    name: "Edit Nice-to-haves, 0 of 1",
  });
  niceToHaves.focus();
  await user.keyboard(" ");
  await user.click(
    query.getByRole("button", {
      name: "Accessible clearances: Not assigned",
    }),
  );
  await user.type(
    query.getByRole("textbox", { name: "Custom priority (optional)" }),
    "Quiet mechanical room",
  );
  await user.click(
    query.getByRole("button", { name: "Assign custom to Nice-to-haves" }),
  );
  assert.equal(query.getByRole("alert").textContent, "Nice-to-have limit reached.");

  await user.click(
    query.getByRole("button", { name: "Edit Deal-breakers, 0 of 1" }),
  );
  await user.click(
    query.getByRole("button", { name: "Assign custom to Deal-breakers" }),
  );
  assert.deepEqual(
    JSON.parse(
      query.getByLabelText("Serialized priority answer").textContent ?? "{}",
    ),
    {
      mustHave: ["Outdoor connection"],
      niceToHave: ["Accessible clearances"],
      dealBreakers: [],
      customItem: {
        label: "Quiet mechanical room",
        priority: "deal-breaker",
      },
      noStrongPrioritiesYet: false,
    },
  );
  assert.match(
    query.getByText(/Choose a group, then choose features/).textContent ?? "",
    /keyboard or touch/,
  );
  await user.click(
    query.getByRole("checkbox", { name: "No strong priorities yet" }),
  );
  assert.deepEqual(
    JSON.parse(
      query.getByLabelText("Serialized priority answer").textContent ?? "{}",
    ),
    {
      mustHave: [],
      niceToHave: [],
      dealBreakers: [],
      customItem: null,
      noStrongPrioritiesYet: true,
    },
  );
});

test("references renderer validates links/files and exposes notes and remove", async () => {
  function Harness() {
    const [items, setItems] = useState<
      Array<{
        id: string;
        kind: "file" | "link";
        label: string;
        detail: string;
        note: string;
      }>
    >([]);
    const [none, setNone] = useState(false);
    return (
      <ReferencesPrompt
        id="references"
        legend="Plans, images, and links"
        items={items}
        noReferencesYet={none}
        onNoReferencesYetChange={setNone}
        onFilesSelected={(files) =>
          setItems((current) => [
            ...current,
            ...files.map((file, index) => ({
              id: `file-${index}`,
              kind: "file" as const,
              label: file.name,
              detail: "Local file",
              note: "",
            })),
          ])
        }
        onLinkAdded={(url) =>
          setItems((current) => [
            ...current,
            {
              id: "link-1",
              kind: "link",
              label: new URL(url).hostname,
              detail: url,
              note: "",
            },
          ])
        }
        onNoteChange={(id, note) =>
          setItems((current) =>
            current.map((item) => (item.id === id ? { ...item, note } : item)),
          )
        }
        onRemove={(id) =>
          setItems((current) => current.filter((item) => item.id !== id))
        }
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  const linkInput = query.getByRole("textbox", { name: "Website link" });
  await user.type(linkInput, "ftp://example.com");
  await user.click(query.getByRole("button", { name: "Add link" }));
  assert.equal(query.getByRole("alert").textContent, "Enter a complete http or https link.");
  await user.clear(linkInput);
  await user.type(linkInput, "https://example.com/plan");
  await user.click(query.getByRole("button", { name: "Add link" }));
  assert.ok(query.getByRole("textbox", { name: /Note for example.com/ }));

  const file = new File(["plan"], "plan.pdf", {
    type: "application/pdf",
  });
  const fileInput = view.container.querySelector('input[type="file"]');
  assert.ok(fileInput);
  await user.upload(fileInput as HTMLInputElement, file);
  assert.ok(query.getAllByText("plan.pdf").length >= 1);
  await user.click(query.getByRole("button", { name: "Remove plan.pdf" }));
  assert.equal(query.queryByText("plan.pdf"), null);
});

test("scene stage moves focus, announces concise progress, and skips delay for reduced motion", async () => {
  const first = requireQuestion("home.heated-square-feet");
  const second = requireQuestion("home.stories");
  const zone = planHomeZones[0];

  function Harness() {
    const [question, setQuestion] = useState(first);
    return (
      <SceneStage
        question={question}
        zone={zone}
        totalQuestions={planHomeQuestions.length}
        scene={<svg data-testid="decorative-scene" />}
        prompt={<button type="button">Prompt control</button>}
        cameraFrame={{ xPercent: 0, yPercent: 0, scale: 1 }}
        reducedMotion
        onBack={() => false}
        onNext={() => {
          setQuestion(second);
          return true;
        }}
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  await user.click(query.getByRole("button", { name: "Next" }));
  const heading = await query.findByRole("heading", {
    name: second.prompt,
    level: 1,
  });
  assert.equal(window.document.activeElement, heading);
  assert.equal(
    view.container.querySelector("[data-transition-state]")?.getAttribute(
      "data-transition-state",
    ),
    "idle",
  );
  assert.equal(
    query.getByRole("progressbar", { name: "Question 5 of 35" }).getAttribute(
      "value",
    ),
    "5",
  );
  const decorative = query.getByTestId("decorative-scene");
  assert.equal(decorative.closest('[aria-hidden="true"]') !== null, true);
  assert.equal(query.queryByText("stair"), null);
});

test("scene stage exposes transition lifecycle and associated reducer errors", async () => {
  const first = requireQuestion("home.heated-square-feet");
  const second = requireQuestion("home.stories");

  function Harness() {
    const [question, setQuestion] = useState(first);
    const [error, setError] = useState<{
      code: "answer-required";
      message: string;
    } | null>(null);
    return (
      <SceneStage
        question={question}
        zone={planHomeZones[0]}
        totalQuestions={35}
        scene={<div>Scene</div>}
        prompt={<button type="button">Prompt control</button>}
        cameraFrame={{ xPercent: 0, yPercent: 0, scale: 1 }}
        error={error}
        onBack={() => false}
        onNext={() => {
          if (!error) {
            setError({
              code: "answer-required",
              message: "Choose one response before continuing.",
            });
            return false;
          }
          setQuestion(second);
          return true;
        }}
      />
    );
  }

  const user = userEvent.setup({ document: window.document });
  const view = render(<Harness />);
  const query = within(view.container);
  const stage = view.container.querySelector("[data-transition-state]");
  assert.ok(stage);
  await user.click(query.getByRole("button", { name: "Next" }));
  assert.equal(stage.getAttribute("data-transition-state"), "exiting");
  await waitFor(() =>
    assert.equal(stage.getAttribute("data-transition-state"), "idle"),
  );
  const alert = query.getByRole("alert");
  assert.match(alert.textContent ?? "", /Choose one response/);
  const promptSection = query.getByRole("region", { name: first.prompt });
  assert.match(promptSection.getAttribute("aria-describedby") ?? "", /stage-error/);
});

test("representative scene stage has no detectable automated accessibility violations", async () => {
  const question = requireQuestion("home.heated-square-feet");
  const group = question.response.optionGroups[0];
  const view = render(
    <main>
      <SceneStage
        question={question}
        zone={planHomeZones[0]}
        totalQuestions={35}
        scene={<div>Decorative elevation</div>}
        prompt={
          <ChoicePrompt
            id="axe-choice"
            legend={group.label}
            options={group.options}
            value={null}
            onChange={() => {}}
          />
        }
        cameraFrame={{ xPercent: 0, yPercent: 0, scale: 1 }}
        reducedMotion
        onBack={() => false}
        onNext={() => false}
      />
    </main>,
  );

  const results = await axe.run(view.container, {
    rules: { "color-contrast": { enabled: false } },
  });
  assert.deepEqual(
    results.violations.map((violation) => violation.id),
    [],
  );
});

test("route shell keeps the active prompt as its single heading", () => {
  const view = render(<PlanYourHomeShell />);
  const query = within(view.container);
  assert.equal(query.getAllByRole("heading").length, 1);
  assert.equal(query.getAllByRole("heading", { level: 1 }).length, 1);
  assert.equal(query.queryByRole("heading", { level: 2 }), null);
});

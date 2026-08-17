import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import {
  planHomeV1Definition,
  summarizePlanHomeAnswer,
  type PlanHomeQuestionDefinition,
  validatePlanHomeAnswer,
  validatePlanHomeDefinition,
} from "../features/plan-your-home/registry.ts";

const expectedZoneIds = [
  "project-and-living",
  "kitchen-and-dining",
  "primary-suite",
  "bedrooms-and-shared-bathrooms",
  "utility-and-systems",
  "exterior-and-site",
  "design-desk-and-review",
];

const expectedQuestions = [
  ["project.starting-services", "What do you have in mind?"],
  ["project.lot-location", "What is your lot status and location?"],
  ["project.site-context", "What do you know about the site?"],
  ["home.heated-square-feet", "How much space are you considering?"],
  ["home.stories", "How many stories are you considering?"],
  ["home.bed-bath-counts", "How many bedrooms and bathrooms do you expect?"],
  ["home.daily-life", "Which daily routines should the home support?"],
  ["living.relationship", "How should the main living spaces feel?"],
  ["living.features", "What matters most in the main living area?"],
  ["home.finish-level", "What finish direction do you have in mind?"],
  ["kitchen.use", "How will you use the kitchen?"],
  ["kitchen.arrangement", "How should the kitchen work and feel?"],
  ["kitchen.support", "What pantry or support spaces interest you?"],
  ["primary.location", "Where should the primary suite go?"],
  ["primary.bedroom-features", "Which primary-bedroom features matter?"],
  ["primary.bath-features", "Which primary-bath features matter?"],
  ["primary.closet-access", "What should the suite's closet and access support?"],
  ["secondary.users-layout", "Who will use the secondary bedrooms?"],
  ["secondary.bath-sharing", "How should secondary bathrooms be shared?"],
  ["utility.laundry", "How should laundry work?"],
  ["home.systems", "Which home comfort and system priorities matter?"],
  ["exterior.garage", "What should the garage handle?"],
  ["exterior.style", "Which exterior character feels right?"],
  ["site.relationships", "Which site features matter most?"],
  ["exterior.outdoor-living", "Which outdoor-living features matter?"],
  ["home.specialty-spaces", "Which specialty or future spaces matter?"],
  ["design.feeling", "How should your new home feel?"],
  ["design.references", "What references show your direction?"],
  ["design.priorities", "What are your key priorities?"],
  ["project.budget-timing", "What are your budget and timing?"],
  ["contact.follow-up", "How should we follow up?"],
];

function question(id: string): PlanHomeQuestionDefinition {
  const match = planHomeV1Definition.questions.find((item) => item.id === id);
  assert.ok(match, `Missing question ${id}`);
  return match;
}

function withQuestionMutation(
  id: string,
  mutate: (value: PlanHomeQuestionDefinition) => PlanHomeQuestionDefinition,
) {
  return {
    ...planHomeV1Definition,
    questions: planHomeV1Definition.questions.map((item) =>
      item.id === id ? mutate(item) : item,
    ),
  };
}

describe("plan-home-v1 registry", () => {
  it("contains 31 contiguous questions in exactly seven ordered zones", () => {
    assert.equal(planHomeV1Definition.id, "plan-home-v1");
    assert.deepEqual(planHomeV1Definition.zones.map((zone) => zone.id), expectedZoneIds);
    assert.deepEqual(planHomeV1Definition.zones.map((zone) => zone.order), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(planHomeV1Definition.questions.length, 31);
    assert.deepEqual(
      planHomeV1Definition.questions.map((item) => item.number),
      Array.from({ length: 31 }, (_, index) => index + 1),
    );
    assert.deepEqual(
      planHomeV1Definition.questions.map(({ id, prompt }) => [id, prompt]),
      expectedQuestions,
    );
    assert.deepEqual(validatePlanHomeDefinition(planHomeV1Definition), []);
  });

  it("locks the complete public copy, stable slugs, limits, and scene bindings", () => {
    const publicContract = planHomeV1Definition.questions.map((item) => ({
      number: item.number,
      id: item.id,
      zoneId: item.zoneId,
      prompt: item.prompt,
      helper: "helper" in item ? item.helper : null,
      sceneAnchor: item.sceneAnchor,
      cameraKey: item.cameraKey,
      optionGroups: item.response.optionGroups.map((group) => ({
        id: group.id,
        label: group.label,
        maxSelections: "maxSelections" in group ? group.maxSelections : null,
        exclusiveOptionSlugs:
          "exclusiveOptionSlugs" in group ? group.exclusiveOptionSlugs : [],
        options: group.options.map((item) => ({
          slug: item.slug,
          label: item.label,
          semantic: item.semantic ?? null,
        })),
      })),
      limits: "limits" in item.response ? item.response.limits : null,
    }));
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(publicContract))
      .digest("hex");

    assert.equal(
      fingerprint,
      "48446785968de0d4e2ac90b5afd8537ca36f94a62a4ac905c4af3bd526576899",
    );
    assert.equal(
      question("home.systems").helper,
      "Choose up to 6 broad priorities. These guide planning, not engineering, equipment, feasibility, or pricing.",
    );
    assert.match(
      question("exterior.style").helper ?? "",
      /not promised designs/,
    );
    assert.match(
      question("site.relationships").helper ?? "",
      /not zoning, setbacks, feasibility, or engineering review/,
    );
  });

  it("keeps every prompt heading and helper within the concise copy standard", () => {
    for (const item of planHomeV1Definition.questions) {
      const words = item.prompt.replace(/[^\p{L}\p{N}&-]+/gu, " ").trim().split(/\s+/);
      assert.ok(
        words.length <= 9,
        `Q${item.number} heading has ${words.length} words: ${item.prompt}`,
      );
      assert.ok(
        item.prompt.length <= 56,
        `Q${item.number} heading has ${item.prompt.length} characters: ${item.prompt}`,
      );
      const helper = "helper" in item ? item.helper : undefined;
      if (helper) {
        assert.ok(
          helper.length <= 120,
          `Q${item.number} helper has ${helper.length} characters: ${helper}`,
        );
      }
    }
  });

  it("keeps IDs, option slugs, scene anchors, camera keys, and defaults valid", () => {
    assert.equal(
      new Set(planHomeV1Definition.questions.map((item) => item.id)).size,
      31,
    );

    for (const item of planHomeV1Definition.questions) {
      const zone = planHomeV1Definition.zones.find((candidate) => candidate.id === item.zoneId);
      assert.ok(zone);
      assert.ok((zone.sceneAnchors as readonly string[]).includes(item.sceneAnchor));
      assert.ok((zone.cameraKeys as readonly string[]).includes(item.cameraKey));
      assert.equal(item.response.responseSchema.safeParse(item.response.defaultAnswer).success, true);
      assert.equal(item.response.answerSchema.safeParse(item.response.exampleAnswer).success, true);

      for (const group of item.response.optionGroups) {
        assert.equal(new Set(group.options.map((option) => option.slug)).size, group.options.length);
      }
    }
  });

  it("matches exact square-footage, finish, and budget bands", () => {
    assert.deepEqual(
      question("home.heated-square-feet").response.optionGroups[0].options.map(({ slug, label }) => [slug, label]),
      [
        ["under-1000", "Under 1,000"],
        ["1000-1499", "1,000–1,499"],
        ["1500-1999", "1,500–1,999"],
        ["2000-2499", "2,000–2,499"],
        ["2500-2999", "2,500–2,999"],
        ["3000-3999", "3,000–3,999"],
        ["4000-4999", "4,000–4,999"],
        ["5000-plus", "5,000+"],
        ["not-sure-yet", "Not sure yet"],
      ],
    );
    assert.equal(question("home.finish-level").response.kind, "text");
    assert.deepEqual(question("home.finish-level").response.limits, { maxLength: 280 });
    assert.deepEqual(
      question("project.budget-timing").response.optionGroups[0].options.map(({ slug, label }) => [slug, label]),
      [
        ["under-300k", "Under $300k"],
        ["300k-499k", "$300k–$499k"],
        ["500k-749k", "$500k–$749k"],
        ["750k-999k", "$750k–$999k"],
        ["1m-1-49m", "$1m–$1.49m"],
        ["1-5m-2-49m", "$1.5m–$2.49m"],
        ["2-5m-plus", "$2.5m+"],
        ["not-sure-yet", "Not sure yet"],
      ],
    );
  });

  it("exposes exact selection, reference, and priority limits", () => {
    assert.equal(question("home.daily-life").response.optionGroups[0].maxSelections, 4);
    assert.equal(question("living.features").response.optionGroups[0].maxSelections, 5);
    assert.equal(question("kitchen.use").response.optionGroups[0].maxSelections, 4);
    assert.equal(question("home.systems").response.optionGroups[0].maxSelections, 6);
    assert.equal(question("exterior.style").response.optionGroups[0].maxSelections, 2);
    assert.equal(question("site.relationships").response.optionGroups[0].maxSelections, 4);
    assert.equal(question("design.feeling").response.optionGroups[0].maxSelections, 3);
    assert.deepEqual(question("design.references").response.limits, {
      total: 10,
      files: 6,
      links: 6,
      bytesPerFile: 10 * 1024 * 1024,
      totalFileBytes: 40 * 1024 * 1024,
    });
    assert.deepEqual(question("design.priorities").response.limits, {
      mustHave: 5,
      niceToHave: 5,
      dealBreaker: 3,
      customItems: 1,
    });
  });

  it("enforces explicit uncertainty and none semantics", () => {
    assert.equal(
      validatePlanHomeAnswer("project.starting-services", {
        startingPoint: "fully-custom",
        services: ["architectural-design", "not-sure-yet"],
      }).success,
      false,
    );
    assert.equal(
      validatePlanHomeAnswer("living.features", ["fireplace", "none"]).success,
      false,
    );
    assert.equal(
      validatePlanHomeAnswer("design.references", {
        references: [],
        noReferencesYet: false,
      }).success,
      false,
    );
    assert.equal(
      validatePlanHomeAnswer("design.priorities", {
        mustHave: [],
        niceToHave: [],
        dealBreakers: [],
        customItem: null,
        noStrongPrioritiesYet: true,
      }).success,
      true,
    );
    assert.equal(
      validatePlanHomeAnswer("design.priorities", {
        mustHave: ["one", "two", "three", "four", "five"],
        niceToHave: [],
        dealBreakers: [],
        customItem: { label: "six", priority: "must-have" },
        noStrongPrioritiesYet: false,
      }).success,
      false,
    );
    assert.equal(
      validatePlanHomeAnswer("home.daily-life", [
        "quiet-and-privacy",
        "entertaining",
        "remote-work-or-study",
        "hobbies-or-making",
        "caregiving",
      ]).success,
      false,
    );
    assert.equal(
      validatePlanHomeAnswer("contact.follow-up", "marketing-email").success,
      false,
    );
  });

  it("produces human-readable answer summaries", () => {
    assert.equal(
      summarizePlanHomeAnswer("home.heated-square-feet", "2500-2999"),
      "2,500–2,999",
    );
    assert.equal(
      summarizePlanHomeAnswer(
        "home.bed-bath-counts",
        "4 bedrooms, 3 full bathrooms, and 1 half bathroom",
      ),
      "4 bedrooms, 3 full bathrooms, and 1 half bathroom",
    );
    assert.equal(
      summarizePlanHomeAnswer("project.budget-timing", {
        budget: "500k-749k",
        designStart: "3-6-months",
      }),
      "Budget: $500k–$749k; Design start: 3–6 months",
    );
  });

  it("rejects duplicate question IDs", () => {
    const duplicate = withQuestionMutation("project.lot-location", (item) => ({
      ...item,
      id: "project.starting-services",
    }));
    assert.match(validatePlanHomeDefinition(duplicate).join("\n"), /duplicate question id/i);
  });

  it("rejects duplicate option slugs", () => {
    const duplicate = withQuestionMutation("home.stories", (item) => ({
      ...item,
      response: {
        ...item.response,
        optionGroups: item.response.optionGroups.map((group, index) =>
          index === 0
            ? { ...group, options: [...group.options, { ...group.options[0] }] }
            : group,
        ),
      },
    }));
    assert.match(validatePlanHomeDefinition(duplicate).join("\n"), /duplicate option slug/i);
  });

  it("rejects missing scene anchors", () => {
    const missingAnchor = withQuestionMutation("home.stories", (item) => ({
      ...item,
      sceneAnchor: "missing-anchor",
    }));
    assert.match(validatePlanHomeDefinition(missingAnchor).join("\n"), /scene anchor/i);
  });

  it("rejects invalid uncertainty configuration", () => {
    const invalid = withQuestionMutation("project.site-context", (item) => ({
      ...item,
      response: {
        ...item.response,
        optionGroups: item.response.optionGroups.map((group) => ({
          ...group,
          exclusiveOptionSlugs: [],
        })),
      },
    }));
    assert.match(validatePlanHomeDefinition(invalid).join("\n"), /uncertainty|exclusive/i);
  });

  it("rejects defaults incompatible with response schemas", () => {
    const invalid = withQuestionMutation("home.bed-bath-counts", (item) => ({
      ...item,
      response: { ...item.response, defaultAnswer: 4 },
    }));
    assert.match(validatePlanHomeDefinition(invalid).join("\n"), /default answer/i);
  });
});

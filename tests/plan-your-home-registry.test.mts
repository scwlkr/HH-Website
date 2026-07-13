import assert from "node:assert/strict";
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
  ["project.starting-services", "Where are you starting, and what help are you looking for?"],
  ["project.lot-location", "What is your lot status, and where are you building or hoping to build?"],
  ["project.site-context", "What do you already know about the site?"],
  ["home.heated-square-feet", "What total heated square footage are you considering?"],
  ["home.stories", "How many stories are you considering?"],
  ["home.bed-bath-counts", "How many bedrooms, full bathrooms, and half bathrooms do you expect?"],
  ["home.future-support", "Who should this home support now and over the next five to ten years?"],
  ["home.daily-life", "Which parts of daily life should the home support especially well?"],
  ["living.relationship", "How should the main living areas relate?"],
  ["living.features", "What matters most in the main living area?"],
  ["home.finish-level", "Which whole-home finish level feels closest to what you want?"],
  ["kitchen.use", "How will the kitchen be used most often?"],
  ["kitchen.arrangement", "What kitchen arrangement sounds closest to what you want?"],
  ["kitchen.support", "What pantry or support spaces interest you?"],
  ["dining.use", "How should dining work in the home?"],
  ["primary.location", "Where should the primary suite be located?"],
  ["primary.bedroom-features", "Which primary-bedroom features matter?"],
  ["primary.bath-features", "Which primary-bath features matter?"],
  ["primary.closet-access", "What should the suite's closet and access support?"],
  ["secondary.users-layout", "Who will use the secondary bedrooms, and how should they be arranged?"],
  ["secondary.bath-sharing", "How should secondary bathrooms be shared?"],
  ["utility.laundry", "Where and how should laundry work?"],
  ["utility.mudroom", "What should the everyday entry or mudroom handle?"],
  ["utility.storage", "Which easy-to-overlook storage needs matter?"],
  ["home.systems", "Which whole-home comfort or system priorities matter?"],
  ["exterior.garage", "What should the garage accommodate?"],
  ["exterior.style", "Which exterior character feels closest to the home you want?"],
  ["site.relationships", "Which relationships to the site matter most?"],
  ["exterior.outdoor-living", "Which outdoor-living features matter?"],
  ["home.specialty-spaces", "Which specialty spaces or future additions should be considered?"],
  ["design.feeling", "How should the new home feel?"],
  ["design.references", "What plans, images, websites, or homes communicate your direction?"],
  ["design.priorities", "What are your must-haves, nice-to-haves, and deal-breakers?"],
  ["project.budget-timing", "What budget range and design timing are you currently planning around?"],
  ["contact.follow-up", "How should h and h follow up after you submit the project brief?"],
];

function question(id: string) {
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
  it("contains 35 contiguous questions in exactly seven ordered zones", () => {
    assert.equal(planHomeV1Definition.id, "plan-home-v1");
    assert.deepEqual(planHomeV1Definition.zones.map((zone) => zone.id), expectedZoneIds);
    assert.deepEqual(planHomeV1Definition.zones.map((zone) => zone.order), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(planHomeV1Definition.questions.length, 35);
    assert.deepEqual(
      planHomeV1Definition.questions.map((item) => item.number),
      Array.from({ length: 35 }, (_, index) => index + 1),
    );
    assert.deepEqual(
      planHomeV1Definition.questions.map(({ id, prompt }) => [id, prompt]),
      expectedQuestions,
    );
    assert.deepEqual(validatePlanHomeDefinition(planHomeV1Definition), []);
  });

  it("keeps IDs, option slugs, scene anchors, camera keys, and defaults valid", () => {
    assert.equal(
      new Set(planHomeV1Definition.questions.map((item) => item.id)).size,
      35,
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
    assert.deepEqual(
      question("home.finish-level").response.optionGroups[0].options.map(({ slug, label }) => [slug, label]),
      [
        ["builder-grade", "Builder Grade"],
        ["builder-plus", "Builder+"],
        ["custom", "Custom"],
        ["not-sure-yet", "Not sure yet"],
      ],
    );
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
        "gathering",
        "quiet-and-privacy",
        "entertaining",
        "remote-work-or-study",
        "hobbies-or-making",
      ]).success,
      false,
    );
    assert.equal(
      validatePlanHomeAnswer("contact.follow-up", {
        method: "email",
        projectContactConsent: false,
      }).success,
      false,
    );
  });

  it("produces human-readable answer summaries", () => {
    assert.equal(
      summarizePlanHomeAnswer("home.heated-square-feet", "2500-2999"),
      "2,500–2,999",
    );
    assert.equal(
      summarizePlanHomeAnswer("home.bed-bath-counts", {
        bedrooms: "4",
        fullBathrooms: "3",
        halfBathrooms: "1",
      }),
      "Bedrooms: 4; Full bathrooms: 3; Half bathrooms: 1",
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
      response: { ...item.response, defaultAnswer: "not-an-answer-object" },
    }));
    assert.match(validatePlanHomeDefinition(invalid).join("\n"), /default answer/i);
  });
});

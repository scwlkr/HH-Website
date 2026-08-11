import assert from "node:assert/strict";
import test from "node:test";

import {
  planHomeSceneIndex,
  preloadNextPlanHomeScene,
} from "../features/plan-your-home/scene-loader.tsx";

test("scene loading keeps the current zone mapped and preloads only its neighbor", async () => {
  const boundaries = [null, 1, 11, 12, 15, 16, 19, 20, 21, 22, 25, 26, 30, 31, 35];
  const expected = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
  assert.deepEqual(boundaries.map(planHomeSceneIndex), expected);

  for (const [questionNumber, currentIndex] of boundaries.map((value, index) => [
    value,
    expected[index],
  ] as const)) {
    const calls: number[] = [];
    const loaders = Array.from({ length: 7 }, (_, loaderIndex) => async () => {
      calls.push(loaderIndex);
    });
    preloadNextPlanHomeScene(questionNumber, loaders);
    await Promise.resolve();
    assert.deepEqual(
      calls,
      currentIndex < 6 ? [currentIndex + 1] : [],
      `Unexpected preload window at question ${questionNumber ?? "welcome"}.`,
    );
  }
});

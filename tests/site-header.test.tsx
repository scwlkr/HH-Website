import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, within } from "@testing-library/react";
import React from "react";

import { SiteHeader } from "../components/layout/site-header.tsx";

afterEach(() => cleanup());

test("the site header limits public navigation to Home, FAQ, and Start", () => {
  const rendered = render(<SiteHeader />);
  const header = within(rendered.getByRole("banner"));
  const primaryNavigation = header.getAllByRole("navigation", {
    name: "Primary",
  });

  assert.equal(primaryNavigation.length, 2);

  for (const navigation of primaryNavigation) {
    const links = within(navigation).getAllByRole("link");

    assert.deepEqual(
      links.map((link) => [link.textContent, link.getAttribute("href")]),
      [
        ["Home", "/"],
        ["FAQ", "/faq"],
      ],
    );
    assert.equal(within(navigation).queryByRole("link", { name: "Projects" }), null);
    assert.equal(within(navigation).queryByRole("link", { name: "Pricing" }), null);
  }

  const startLinks = header.getAllByRole("link", { name: "Start a Project" });
  assert.equal(startLinks.length, 2);
  assert.ok(startLinks.every((link) => link.getAttribute("href") === "/start"));
});

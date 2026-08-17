import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, within } from "@testing-library/react";
import React from "react";

import { SiteFooter } from "../components/layout/site-footer.tsx";

afterEach(() => cleanup());

test("the site footer is a compact branded directory", () => {
  const rendered = render(<SiteFooter />);
  const footer = within(rendered.getByRole("contentinfo"));

  assert.ok(footer.getByRole("img", { name: "Howeth and Harp" }));
  assert.ok(footer.getByText("Design. Build. Develop."));

  const explore = within(footer.getByRole("navigation", { name: "Explore" }));
  const contact = within(footer.getByRole("navigation", { name: "Contact" }));
  const information = within(
    footer.getByRole("navigation", { name: "Information" }),
  );
  const agents = within(
    footer.getByRole("navigation", { name: "Agent resources" }),
  );

  for (const label of ["Projects", "Pricing", "FAQ", "Start a Project"]) {
    assert.ok(explore.getByRole("link", { name: label }));
  }
  assert.equal(explore.queryByRole("link", { name: "Home" }), null);
  assert.equal(
    contact.getByRole("link", { name: "hello@howethandharp.com" }).getAttribute(
      "href",
    ),
    "mailto:hello@howethandharp.com",
  );
  assert.ok(information.getByRole("link", { name: "Privacy" }));
  assert.ok(information.getByRole("link", { name: "Terms" }));
  assert.ok(agents.getByRole("link", { name: "Markdown Sitemap" }));
  assert.ok(agents.getByRole("link", { name: "Agent Guide" }));
  assert.ok(agents.getByRole("link", { name: "Services Guide" }));
  assert.ok(footer.getByText("For agents:"));

  assert.equal(footer.queryByText("Blake"), null);
  assert.equal(
    footer.queryByText("Architectural design, building, and land development."),
    null,
  );
  assert.equal(
    footer.queryByText(/Planning a project\? Share your location/i),
    null,
  );
  assert.match(footer.getByText(/h and h$/).textContent ?? "", /^© \d{4} h and h$/);
});

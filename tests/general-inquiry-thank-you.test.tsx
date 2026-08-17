import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import React from "react";
import { cleanup, render, within } from "@testing-library/react";

import ThankYouPage from "../app/thank-you/page.tsx";

afterEach(cleanup);

test("the general inquiry confirmation describes the contact information actually collected", () => {
  const view = render(<ThankYouPage />);
  const query = within(view.container);

  assert.ok(query.getByRole("heading", { level: 1, name: "Inquiry Received" }));
  assert.ok(query.getByText(/project inquiry has been received/i));
  assert.ok(query.getAllByText(/contact information you provided/i).length > 0);
  assert.equal(query.queryByText(/project brief/i), null);
  assert.equal(query.queryByText(/preferred contact method|method you selected/i), null);
});

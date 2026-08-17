import assert from "node:assert/strict";
import test from "node:test";

import {
  getGeneralInquiryFormValues,
  toGeneralInquirySubmissionInput,
  validateGeneralInquiryValues,
} from "../lib/validation/inquiry.ts";

test("a short general inquiry accepts email as the only contact channel", () => {
  const values = {
    name: "Morgan Homeowner",
    phone: "",
    email: "morgan@example.com",
    projectType: "remodel-addition" as const,
    projectLocation: "",
    projectDescription: "We are considering a kitchen addition.",
    sourcePage: "/start",
    utmSource: "catalog",
    utmMedium: "",
    utmCampaign: "",
    company: "",
  };

  assert.equal(validateGeneralInquiryValues(values).success, true);
  assert.deepEqual(toGeneralInquirySubmissionInput(values), {
    schemaVersion: 1,
    experience: "general-inquiry",
    name: "Morgan Homeowner",
    phone: null,
    email: "morgan@example.com",
    projectType: "remodel-addition",
    projectLocation: null,
    projectDescription: "We are considering a kitchen addition.",
    sourcePage: "/start",
    utmSource: "catalog",
    utmMedium: null,
    utmCampaign: null,
  });
});

test("a short general inquiry accepts phone as the only contact channel", () => {
  const formData = new FormData();
  formData.set("name", "Taylor Caller");
  formData.set("phone", "(214) 555-0100");
  formData.set("projectType", "other-not-sure");
  formData.set("projectDescription", "I would like to discuss a possible project.");
  formData.set("sourcePage", "/start");

  const values = getGeneralInquiryFormValues(formData);
  assert.equal(validateGeneralInquiryValues(values).success, true);
  assert.equal(toGeneralInquirySubmissionInput(values).email, null);
  assert.equal(
    toGeneralInquirySubmissionInput(values).phone,
    "(214) 555-0100",
  );
});

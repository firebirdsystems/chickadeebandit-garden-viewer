import { describe, it, expect } from "vitest";
import { failureLine, uploadFailureLine } from "../src/logic.js";

const err = (props, message = "hub text") => Object.assign(new Error(message), props);
const words = { action: "add the photo", thing: "photo" };

describe("failureLine", () => {
  it("names a duplicate by code, or by the hub's text while production lags", () => {
    expect(failureLine(err({ status: 400, code: "UNIQUE_CONSTRAINT" }), words)).toBe("That photo already exists.");
    expect(failureLine(err({ status: 400 }, "UNIQUE constraint failed: x.id"), words)).toBe("That photo already exists.");
  });
  it("names a refusal without asking for a retry", () => {
    expect(failureLine(err({ status: 403 }), words)).toBe("You don’t have permission to add the photo.");
    expect(failureLine(err({ status: 507 }), words)).toBe("The household’s storage is full — free up space first.");
    expect(failureLine(err({ status: 429 }), words)).toBe("Too many tries — wait a minute and try again.");
  });
  it("splits a write that changed nothing by the caller's re-read", () => {
    expect(failureLine(null, { ...words, found: false })).toBe("This photo has been removed.");
    expect(failureLine(null, { ...words, found: true })).toBe("You don’t have permission to add the photo.");
  });
  it("reads a 404 as removed and a bare 409 as changed when there is no re-read", () => {
    expect(failureLine(err({ status: 404 }), words)).toBe("This photo has been removed.");
    expect(failureLine(err({ status: 409 }), words)).toBe("This photo was changed by someone else — check it first.");
  });
  it("asks for a retry only when retrying can work", () => {
    for (const e of [err({}), err({ status: 0 }), err({ status: 500 }), err({ status: 503 }), err({ status: 400 }), new TypeError("Failed to fetch"), undefined]) {
      expect(failureLine(e, words)).toBe("Couldn’t add the photo — try again.");
    }
  });
  it("keeps a line the page wrote for the user, and never shows hub text", () => {
    expect(failureLine(err({ forUser: true }, "Pick a garden first."), words)).toBe("Pick a garden first.");
    expect(failureLine(err({ status: 500 }, "D1_ERROR: boom"), words)).not.toMatch(/D1_ERROR/);
  });
});

// The hub's answers, from files-handler.ts handleFileUpload: 413 too large, 415 a type it
// does not take or content that does not match it, 403 a write ACL, 429 its rate limit,
// 507 storage full, 400 a malformed form or filename. The SDK's upload puts `status` on
// its Error (0 when nothing answered).
describe("uploadFailureLine", () => {
  const plan = { action: "upload the floor plan", thing: "floor plan" };
  it("names the file's own refusals", () => {
    expect(uploadFailureLine(err({ status: 413 }, "File too large (max 10 MB)"), plan)).toBe("That file is too large.");
    expect(uploadFailureLine(err({ status: 415 }, "File type not allowed: image/x"), plan)).toBe("That kind of file can’t be uploaded.");
  });
  it("gives the rest the table's lines", () => {
    expect(uploadFailureLine(err({ status: 403 }, "File writes require an adult member"), plan)).toBe("You don’t have permission to upload the floor plan.");
    expect(uploadFailureLine(err({ status: 507 }, "Storage limit exceeded"), plan)).toBe("The household’s storage is full — free up space first.");
    expect(uploadFailureLine(err({ status: 429 }, "Too many requests"), plan)).toBe("Too many tries — wait a minute and try again.");
    for (const e of [err({ status: 0 }, "Network error"), err({ status: 400 }, "Invalid or overlong filename"), err({ status: 502 })]) {
      expect(uploadFailureLine(e, plan)).toBe("Couldn’t upload the floor plan — try again.");
    }
  });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { getCalendarEmbedUrl } from "./calendar.ts";

const CHRISTINA = "stpcAKnqCXRrOyh372GO";
const TISH = "Fdsuq47BXjgpKtNacukU";

test("a referring agent's own calendar beats the hardcoded 1:1 default", () => {
  const url = getCalendarEmbedUrl("oneonone", undefined, TISH);
  assert.ok(url?.includes(TISH), url ?? "null");
  assert.ok(!url?.includes(CHRISTINA));
});

test("no override still lands on Christina", () => {
  const url = getCalendarEmbedUrl("oneonone", undefined, null);
  assert.ok(url?.includes(CHRISTINA), url ?? "null");
});

test("a blank override is ignored rather than producing a broken url", () => {
  const url = getCalendarEmbedUrl("oneonone", undefined, "   ");
  assert.ok(url?.includes(CHRISTINA), url ?? "null");
});

test("the premium tier honours the referring agent too", () => {
  const url = getCalendarEmbedUrl("tish", undefined, CHRISTINA);
  assert.ok(url?.includes(CHRISTINA), url ?? "null");
});

test("an override cannot resurrect booking on the not-a-fit route", () => {
  assert.equal(getCalendarEmbedUrl("notfit", undefined, TISH), null);
});

test("contact details are still prefilled alongside an override", () => {
  const url = getCalendarEmbedUrl(
    "oneonone",
    { firstName: "Zed", lastName: "Test", email: "z@example.com", phone: "5555550100" },
    TISH,
  );
  assert.ok(url?.includes("first_name=Zed"), url ?? "null");
  assert.ok(url?.includes(TISH));
});

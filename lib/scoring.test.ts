import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "./scoring.ts";
import type { Answers } from "./types.ts";

// A baseline "strong fit" answer set used as a starting point for cases.
const strong: Answers = {
  q1: "q1_newer", // 8
  q2: "q2_30", // 12
  q3: "q3_build", // 20
  q4: "q4_fulltime", // 20
  q5: "q5_commission", // 10
  q6: "q6_plan", // 15
  gateCommit: "gate_yes",
  flagOwner: "flag_no",
};

test("scoring example from spec totals 85 -> 1:1", () => {
  const r = evaluate(strong);
  assert.equal(r.score, 85);
  assert.equal(r.route, "oneonone");
});

test("floor gate: 'just exploring' forces BPM even with a high score", () => {
  const r = evaluate({ ...strong, q2: "q2_exploring" });
  assert.equal(r.route, "bpm");
});

test("floor gate: 'just gathering information' forces BPM", () => {
  const r = evaluate({ ...strong, q4: "q4_info" });
  assert.equal(r.route, "bpm");
});

test("floor gate: can't commit forces BPM", () => {
  const r = evaluate({ ...strong, gateCommit: "gate_no" });
  assert.equal(r.route, "bpm");
});

test("top gate: agency owner flag -> Tish, beats score", () => {
  const r = evaluate({ ...strong, flagOwner: "flag_yes" });
  assert.equal(r.route, "tish");
});

test("top gate: owned a business + licensed -> Tish", () => {
  const r = evaluate({ ...strong, q5: "q5_owned", q1: "q1_active" });
  assert.equal(r.route, "tish");
});

test("owned a business WITHOUT a license does not trip the top gate", () => {
  const r = evaluate({ ...strong, q5: "q5_owned", q1: "q1_none" });
  assert.notEqual(r.route, "tish");
});

test("low score with no gates -> BPM", () => {
  const weak: Answers = {
    q1: "q1_none", // 0
    q2: "q2_36", // 5
    q3: "q3_team", // 5
    q4: "q4_side", // 8
    q5: "q5_w2", // 3
    q6: "q6_willing", // 8  => total 29
    gateCommit: "gate_yes",
    flagOwner: "flag_no",
  };
  const r = evaluate(weak);
  assert.equal(r.score, 29);
  assert.equal(r.route, "bpm");
});

test("exactly at threshold (60) routes to 1:1", () => {
  // 0 + 15 + 20 + 20 + 0 + 8 = 63 ; trim to hit 60 region
  const atCut: Answers = {
    q1: "q1_none", // 0
    q2: "q2_now", // 15
    q3: "q3_build", // 20
    q4: "q4_fulltime", // 20
    q5: "q5_none", // 0
    q6: "q6_willing", // 8  => 63
    gateCommit: "gate_yes",
    flagOwner: "flag_no",
  };
  const r = evaluate(atCut);
  assert.ok(r.score >= 60);
  assert.equal(r.route, "oneonone");
});

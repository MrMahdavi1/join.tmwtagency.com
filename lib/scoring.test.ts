import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "./scoring.ts";
import { MAX_SCORE } from "./questions.ts";
import type { Answers } from "./types.ts";

// A baseline "strong fit" answer set used as a starting point for cases.
const strong: Answers = {
  q1: "q1_newer", // 8
  q2: "q2_30", // 11
  q3: "q3_build", // 20
  q4: "q4_fulltime", // 20
  q5: "q5_commission", // 10
  q6: "q6_already", // 15
  gateCommit: "gate_yes",
  flagOwner: "flag_newer",
};

test("scored questions still total 100 max", () => {
  assert.equal(MAX_SCORE, 100);
});

test("strong-fit answers clear the cutoff -> 1:1", () => {
  const r = evaluate(strong);
  assert.equal(r.score, 84);
  assert.equal(r.route, "oneonone");
});

test("floor gate: Q2 'just exploring' forces BPM even with a high score", () => {
  const r = evaluate({ ...strong, q2: "q2_exploring" });
  assert.equal(r.route, "bpm");
});

test("floor gate: Q4 'just exploring' forces BPM", () => {
  const r = evaluate({ ...strong, q4: "q4_exploring" });
  assert.equal(r.route, "bpm");
});

test("floor gate: can't commit forces BPM", () => {
  const r = evaluate({ ...strong, gateCommit: "gate_no" });
  assert.equal(r.route, "bpm");
});

test("top gate: agency owner -> Tish, beats score", () => {
  assert.equal(evaluate({ ...strong, flagOwner: "flag_agency" }).route, "tish");
});

test("top gate: producer with a team -> Tish", () => {
  assert.equal(evaluate({ ...strong, flagOwner: "flag_producer_team" }).route, "tish");
});

test("top gate: solo licensed producer open to a new home -> Tish", () => {
  assert.equal(evaluate({ ...strong, flagOwner: "flag_solo" }).route, "tish");
});

test("'newer / just getting started' does NOT trip the Q8 top gate", () => {
  assert.notEqual(evaluate({ ...strong, flagOwner: "flag_newer" }).route, "tish");
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
    q2: "q2_30", // 11
    q3: "q3_team", // 5
    q4: "q4_side", // 8
    q5: "q5_w2", // 3
    q6: "q6_results", // 5  => total 32
    gateCommit: "gate_yes",
    flagOwner: "flag_newer",
  };
  const r = evaluate(weak);
  assert.equal(r.score, 32);
  assert.equal(r.route, "bpm");
});

test("at/above the 60 cutoff routes to 1:1", () => {
  const atCut: Answers = {
    q1: "q1_none", // 0
    q2: "q2_now", // 15
    q3: "q3_build", // 20
    q4: "q4_fulltime", // 20
    q5: "q5_none", // 0
    q6: "q6_ready", // 12 => 67
    gateCommit: "gate_yes",
    flagOwner: "flag_newer",
  };
  const r = evaluate(atCut);
  assert.ok(r.score >= 60);
  assert.equal(r.route, "oneonone");
});

// ---- "Not a fit" worst-track (client request, 6/30) ----

// The full "do everything horrible" walk-through from the call: unlicensed,
// just exploring, no goal, no experience, won't invest, can't commit.
const dregs: Answers = {
  q1: "q1_none",
  q2: "q2_exploring",
  q3: "q3_team",
  q4: "q4_exploring",
  q5: "q5_none",
  q6: "q6_results",
  gateCommit: "gate_no",
  flagOwner: "flag_newer",
};

test("rock-bottom answers route to 'not a fit', not BPM", () => {
  assert.equal(evaluate(dregs).route, "notfit");
});

test("not-a-fit also fires when they expect it all provided (even if willing to commit)", () => {
  const r = evaluate({ ...dregs, gateCommit: "gate_yes", q6: "q6_provided" });
  assert.equal(r.route, "notfit");
});

test("can't-commit but otherwise solid stays in BPM, not 'not a fit'", () => {
  // strong baseline (licensed, real goals) who simply can't commit the time.
  const r = evaluate({ ...strong, gateCommit: "gate_no" });
  assert.equal(r.route, "bpm");
});

test("an agency owner is never filtered out, even with weak answers", () => {
  const r = evaluate({ ...dregs, flagOwner: "flag_agency" });
  assert.equal(r.route, "tish");
});

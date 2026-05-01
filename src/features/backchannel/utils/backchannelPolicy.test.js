import test from "node:test";
import assert from "node:assert/strict";
import { pickBackchannelUtterance } from "./backchannelPolicy.js";

test("pickBackchannelUtterance only returns allowed phrases", () => {
  const a = pickBackchannelUtterance(null);
  const b = pickBackchannelUtterance(a);
  assert.ok(a === "mmhmm" || a === "yeah");
  assert.ok(b === "mmhmm" || b === "yeah");
});


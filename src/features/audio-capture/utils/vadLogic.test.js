import test from "node:test";
import assert from "node:assert/strict";
import { frameLooksLikeSpeech, updateVadState } from "./vadLogic.js";
import { audioConfig } from "../audioConfig.js";

test("frameLooksLikeSpeech gates by dB threshold", () => {
  const cfg = { ...audioConfig, noiseGateDb: -40, minSpeechBandRatio: 0.2, maxLowBandRatio: 0.65 };
  assert.equal(frameLooksLikeSpeech({ rmsDb: -60, speechBandRatio: 0.9, lowBandRatio: 0.1 }, cfg), false);
  assert.equal(frameLooksLikeSpeech({ rmsDb: -39, speechBandRatio: 0.9, lowBandRatio: 0.1 }, cfg), true);
});

test("frameLooksLikeSpeech rejects frames without speech-band energy", () => {
  const cfg = { ...audioConfig, noiseGateDb: -60, minSpeechBandRatio: 0.2, maxLowBandRatio: 0.65 };
  assert.equal(frameLooksLikeSpeech({ rmsDb: -30, speechBandRatio: 0.05, lowBandRatio: 0.1 }, cfg), false);
  assert.equal(frameLooksLikeSpeech({ rmsDb: -30, speechBandRatio: 0.25, lowBandRatio: 0.1 }, cfg), true);
});

test("frameLooksLikeSpeech rejects low-frequency dominated noise", () => {
  const cfg = { ...audioConfig, noiseGateDb: -60, minSpeechBandRatio: 0.2, maxLowBandRatio: 0.65 };
  assert.equal(frameLooksLikeSpeech({ rmsDb: -20, speechBandRatio: 0.4, lowBandRatio: 0.9 }, cfg), false);
});

test("updateVadState enforces minimum speech duration and minimum silence duration", () => {
  const cfg = { ...audioConfig, minSpeechMs: 200, minSilenceMs: 250 };
  let st = { isSpeaking: false, aboveSinceMs: null, silenceSinceMs: null };

  st = updateVadState(st, { rmsDb: -20, speechBandRatio: 0.4, lowBandRatio: 0.1 }, 0, cfg);
  assert.equal(st.isSpeaking, false);
  st = updateVadState(st, { rmsDb: -20, speechBandRatio: 0.4, lowBandRatio: 0.1 }, 150, cfg);
  assert.equal(st.isSpeaking, false);
  st = updateVadState(st, { rmsDb: -20, speechBandRatio: 0.4, lowBandRatio: 0.1 }, 220, cfg);
  assert.equal(st.isSpeaking, true);

  st = updateVadState(st, { rmsDb: -80, speechBandRatio: 0, lowBandRatio: 0 }, 300, cfg);
  assert.equal(st.isSpeaking, true);
  st = updateVadState(st, { rmsDb: -80, speechBandRatio: 0, lowBandRatio: 0 }, 560, cfg);
  assert.equal(st.isSpeaking, false);
});


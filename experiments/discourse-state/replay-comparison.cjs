"use strict";

const assert = require("node:assert/strict");
const { DiscourseState, choose, scopedChoice } = require("./referent-choice.cjs");

function compareReplay(turns) {
  assert.ok(Number.isSafeInteger(turns) && turns >= 1);
  const state = new DiscourseState();
  const reader = "동료";
  const target = "민석";
  const history = [{ kind: "focus", reader, referents: [target] }];
  state.update(history[0]);
  let replayUpdates = 0;
  let matched = 0;
  for (let turn = 0; turn < turns; turn++) {
    const event = (turn % 2 === 0)
      ? { kind: "enter" }
      : { kind: "leave" };
    history.push(event);
    state.update(event);
    const streamed = choose(state.candidates(reader), target);
    const replayed = scopedChoice({ events: history, reader, target });
    replayUpdates += history.length;
    if (streamed === replayed) matched++;
  }
  return { turns, matched, replayUpdates, streamUpdates: history.length };
}

if (require.main === module) {
  const results = [16, 64, 256, 1024].map(compareReplay);
  for (const result of results) assert.equal(result.matched, result.turns);
  console.log(JSON.stringify(results, null, 2));
}

module.exports = { compareReplay };

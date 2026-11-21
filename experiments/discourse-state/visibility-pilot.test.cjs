"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { first, second, firstPhase } = require("./visibility-pilot.cjs");
const works = require("./visibility-fixtures.json");

test("first-stage visibility is the only prompt change in the matched conditions", () => {
  assert.equal(new Set(firstPhase().map(x => x.id)).size, 18);
  for (const w of works) {
    const hidden = first(w, "concealed");
    const shown = first(w, "visible");
    assert.deepEqual(hidden.prompt[0], shown.prompt[0]);
    const expected = JSON.parse(shown.prompt[1].content);
    assert.equal(expected.둘째_문장에서_공개할_내용, w.reveal);
    expected.둘째_문장에서_공개할_내용 = null;
    assert.deepEqual(JSON.parse(hidden.prompt[1].content), expected);
    assert.ok(!hidden.prompt[1].content.includes(w.focus));
  }
});

test("the second request is identical for equal prefixes across matched arms", () => {
  for (const w of works) {
    const hidden = second(w, "concealed", "같은 첫 문장.");
    const shown = second(w, "visible", "같은 첫 문장.");
    assert.equal(hidden.promptSha256, shown.promptSha256);
    assert.notEqual(shown.promptSha256, second(w, "visible", "다른 첫 문장.").promptSha256);
    const payload = JSON.parse(shown.prompt[1].content);
    assert.equal(payload.첫_문장에서_실제로_쓴_내용, "같은 첫 문장.");
    assert.equal(payload.둘째_문장에_보존할_어구, w.protect);
    assert.deepEqual(payload.둘째_문장_자료, [w.closing, w.reveal]);
  }
});

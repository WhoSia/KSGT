"use strict";

const cases = require("./fixtures.json");

class DiscourseState {
  constructor() {
    this.frames = [new Map()];
  }

  update(event) {
    if (event.kind === "enter") {
      this.frames.push(new Map());
      return;
    }
    if (event.kind === "leave") {
      if (this.frames.length === 1) throw new Error("Cannot leave the root frame");
      this.frames.pop();
      return;
    }

    const readers = this.frames.at(-1);
    if (event.kind === "focus") {
      readers.set(event.reader, new Set(event.referents));
    } else if (event.kind === "add") {
      // Knowing one visible mention cannot complete an unknown earlier state.
      readers.get(event.reader)?.add(event.referent);
    } else {
      throw new Error("Unknown event: " + event.kind);
    }
  }

  candidates(reader) {
    return this.frames.at(-1).get(reader);
  }
}

function choose(candidates, target) {
  return candidates?.size === 1 && candidates.has(target) ? "omit" : "name";
}

function scopedChoice(example) {
  const state = new DiscourseState();
  for (const event of example.events) state.update(event);
  return choose(state.candidates(example.reader), example.target);
}

function readerOnlyChoice(example) {
  return scopedChoice({
    ...example,
    events: example.events.filter(event => event.kind !== "enter" && event.kind !== "leave"),
  });
}

function scopeOnlyChoice(example) {
  return scopedChoice({
    ...example,
    reader: "shared",
    events: example.events.map(event => ({ ...event, reader: "shared" })),
  });
}

function score(rows, decide) {
  const counts = { safeOmits: 0, unsafeOmits: 0, missedOmits: 0, namedRequired: 0 };
  for (const example of rows) {
    const omitted = decide(example) === "omit";
    if (omitted && example.allowOmit) counts.safeOmits++;
    if (omitted && !example.allowOmit) counts.unsafeOmits++;
    if (!omitted && example.allowOmit) counts.missedOmits++;
    if (!omitted && !example.allowOmit) counts.namedRequired++;
  }
  return counts;
}

function run() {
  const methods = {
    alwaysName: () => "name",
    readerOnly: readerOnlyChoice,
    scopeOnly: scopeOnlyChoice,
    scoped: scopedChoice,
  };
  const scores = Object.fromEntries(
    Object.entries(methods).map(([name, decide]) => [name, score(cases, decide)]),
  );
  const exampleResults = cases.map(example => {
    const choices = Object.fromEntries(
      Object.entries(methods).map(([name, decide]) => [name, decide(example)]),
    );
    return { id: example.id, expectedOmit: example.allowOmit, choices, text: example[choices.scoped] };
  });
  return { scores, exampleResults };
}

if (require.main === module) console.log(JSON.stringify(run(), null, 2));
module.exports = { DiscourseState, scopedChoice, run, score };

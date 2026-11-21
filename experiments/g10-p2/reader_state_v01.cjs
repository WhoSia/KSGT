"use strict";
/**
 * G10-P2 R1 closed-grammar reader-state controller.
 * NOT a Korean semantic parser: only authored source and surface licenses count.
 * Updating the planned state does NOT count as observing a realized sentence.
 */
const fs = require("node:fs");
const path = require("node:path");
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname,
  "fixtures/r1_reader_state_author_dev_v01.json"), "utf8"));

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}
function validateWork(work) {
  requireCondition(work && typeof work.id === "string" && work.id.length > 0,
    "INVALID_WORK");
  requireCondition(Array.isArray(work.source) && work.source.length > 0,
    "INVALID_SOURCE");
  requireCondition(Array.isArray(work.facts) && work.facts.length === work.source.length,
    "INVALID_FACTS");
  const source = work.source.join(" ");
  const ids = new Set(), surfaces = new Map(), witness = new Map();
  let at = 0;
  for (let i = 0; i < work.facts.length; i++) {
    const f = work.facts[i];
    requireCondition(f && /^F[1-9][0-9]*$/.test(f.id) && !ids.has(f.id),
      "DUPLICATED_FACT_ID");
    ids.add(f.id);
    requireCondition(typeof f.source === "string" &&
      f.source === work.source[i] && f.source.length > 10,
      "SOURCE_FACT_MISMATCH");
    const index = source.indexOf(f.source, at);
    requireCondition(index === at && source.indexOf(f.source, at + 1) < 0,
      "SOURCE_WITNESS_NOT_UNIQUE_OR_ORDERED");
    witness.set(f.id, { factId:f.id, text:f.source, sourceSpan:[at,at+f.source.length] });
    at += f.source.length + 1;
    requireCondition(Array.isArray(f.variants) && f.variants.length >= 2,
      "INSUFFICIENT_LICENSED_VARIANTS");
    for (const phrase of f.variants) {
      requireCondition(typeof phrase === "string" && phrase.trim() === phrase &&
        phrase.length > 3 && !phrase.includes("\n") && !surfaces.has(phrase),
        "AMBIGUOUS_SURFACE");
      surfaces.set(phrase, f.id);
    }
  }
  requireCondition(work.second && ids.has(work.second.factId) &&
    work.second.explicit !== work.second.anaphoric &&
    surfaces.get(work.second.explicit) === work.second.factId &&
    surfaces.get(work.second.anaphoric) === work.second.factId &&
    Array.isArray(work.second.requires) && work.second.requires.length > 0 &&
    work.second.requires.every(id => ids.has(id) && id !== work.second.factId),
    "BAD_ANAPHORIC_CONTRACT");
  return { id:work.id, source, witness, surfaces };
}
function observe(work, sentences) {
  const rule = validateWork(work);
  requireCondition(Array.isArray(sentences) && sentences.every(s => typeof s === "string"),
    "INVALID_REALIZED_SENTENCES");
  const known = new Set(), events = [], evidence = [];
  let offset = 0;
  for (const sentence of sentences) {
    const id = rule.surfaces.get(sentence) || null;
    let status = "UNKNOWN";
    if (id && known.has(id)) status = "DUPLICATE";
    else if (id) {
      known.add(id);
      status = "OBSERVED";
      evidence.push({ factId:id, sourceSpan:[...rule.witness.get(id).sourceSpan],
        outputSpan:[offset,offset+sentence.length], sourceText:rule.witness.get(id).text,
        outputText:sentence });
    }
    events.push({ status, factId:id, outputSpan:[offset,offset+sentence.length],
      surface:sentence });
    offset += sentence.length + 1;
  }
  return { known:[...known], events, evidence, actualText:sentences.join("\n"),
    observedSentences:sentences.length };
}
/**
 * Plan-only and sham are deliberately UNSOUND controls: they invent a reader's
 * awareness without an observed sentence. Never use for deployed selections.
 */
function choose(work, realizedPrefix, mode="observed") {
  const view = observe(work, realizedPrefix);
  const second = work.second;
  const available = new Set(view.known);
  if (mode === "plan_only" || mode === "sham") {
    for (const id of second.requires) available.add(id);
  } else requireCondition(mode === "observed", "UNKNOWN_POLICY");
  const anaphoraIsGrounded = second.requires.every(id => available.has(id));
  const surface = anaphoraIsGrounded ? second.anaphoric : second.explicit;
  const rule = validateWork(work);
  requireCondition(rule.surfaces.get(surface) === second.factId, "UNLICENSED_CONTINUATION");
  return { policy:mode, surface, modeChosen:anaphoraIsGrounded?"ANAPHORIC":"EXPLICIT",
    evidenceAvailable:second.requires.filter(id => view.known.includes(id)),
    factId:second.factId, sourceSpan:rule.witness.get(second.factId).sourceSpan,
    actualKnown:view.known, events:view.events };
}
function assessDraft(work, lines) {
  const read = observe(work, lines);
  if (read.events.some(x => x.status === "UNKNOWN" || x.status === "DUPLICATE"))
    return { decision:"ABSTAIN", output:read.actualText, reason:"UNSUPPORTED_OR_DUPLICATED_SURFACE" };
  if (lines.length !== 2) return { decision:"ABSTAIN", output:read.actualText,
    reason:"OUTSIDE_TWO_SENTENCE_CONTRACT" };
  const f = work.second.factId;
  if (read.events[1].factId !== f) return { decision:"ABSTAIN",
    output:read.actualText, reason:"UNEXPECTED_SECOND_FACT" };
  if (lines[1] === work.second.anaphoric &&
    !work.second.requires.every(id => read.events[0].factId === id)) {
    // A repair is allowed only for this exact licensed dangling reference.
    return { decision:"REVISE", output:lines[0]+"\n"+work.second.explicit,
      reason:"ANAPHORIC_REFERENCE_NOT_WARRANTED", replacedLine:1 };
  }
  return { decision:"KEEP", output:read.actualText, reason:"NO_AUTHORITATIVE_DEFECT" };
}
function replaceAndReplay(work, lines, index, nextSentence) {
  requireCondition(Number.isInteger(index) && index>=0 && index<lines.length,
    "BAD_REPLACEMENT_INDEX");
  const replaced = lines.slice();
  replaced[index] = nextSentence;
  return { lines:replaced, state:observe(work,replaced),
    next:choose(work,replaced,"observed") };
}
function diagnostic(work) {
  const f = work.facts[0];
  const valid = [f.variants[0]];
  const missing = [];
  const unsupported = ["“"+f.variants[0]+"”라는 주장은 확인되지 않았다."];
  const truth = choose(work,valid,"observed");
  const blank = choose(work,missing,"observed");
  const wrong = choose(work,missing,"plan_only");
  const quote = choose(work,unsupported,"observed");
  return {work:work.id,genre:work.genre,
    witnessedSource:observe(work,valid).evidence.length,
    validMode:truth.modeChosen,absentMode:blank.modeChosen,
    quotedMode:quote.modeChosen,planOnlyAbsentMode:wrong.modeChosen,
    planOnlyDanglingReference:wrong.modeChosen==="ANAPHORIC" &&
      blank.modeChosen==="EXPLICIT",
    exampleActual:valid.concat(truth.surface).join("\n"),
    exampleAbsent:blank.surface};
}
function main() {
  const output = { status:"FINITE_AUTHOR_EXPOSED_DEV_ONLY_NO_HUMAN_GOLD",
    works:DATA.works.map(diagnostic), providerCalls:0, humanRatings:0 };
  process.stdout.write(JSON.stringify(output,null,2)+"\n");
}
if (require.main === module) main();
module.exports = {DATA,validateWork,observe,choose,assessDraft,replaceAndReplay,diagnostic};

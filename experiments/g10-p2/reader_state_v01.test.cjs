"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DATA, validateWork, observe, choose, assessDraft, replaceAndReplay, diagnostic } =
  require("./reader_state_v01.cjs");

function works() { return DATA.works; }

test("all four genre fixtures have source-ordered unique fact witnesses", () => {
  assert.equal(DATA.status,"AUTHOR_SYNTHETIC_EXPOSED_DEV_NOT_READER_GOLD");
  assert.deepEqual(works().map(x=>x.genre).sort(),["chat","notice","scene","science"]);
  for (const work of works()) {
    const contract=validateWork(work);
    assert.equal(contract.source,work.source.join(" "));
    assert.equal(contract.witness.size,2);
    for (const f of work.facts) {
      const witness=contract.witness.get(f.id);
      assert.equal(contract.source.slice(...witness.sourceSpan),f.source);
      assert.ok(witness.sourceSpan[0] >= 0);
    }
  }
});
test("state updates only from actual realized licensed lines", () => {
  for (const work of works()) {
    const actual=work.facts[0].variants[0];
    const observed=observe(work,[actual]);
    assert.deepEqual(observed.known,["F1"]);
    assert.equal(observed.evidence[0].factId,"F1");
    assert.equal(observed.evidence[0].outputText,actual);
    assert.deepEqual(observed.evidence[0].outputSpan,[0,actual.length]);
    assert.equal(choose(work,[actual]).surface,work.second.anaphoric);
    const completed=observe(work,[actual,work.second.anaphoric]);
    assert.deepEqual(completed.known,["F1","F2"]);
    assert.equal(completed.evidence[1].outputSpan[0],actual.length+1);
    assert.equal(completed.actualText.split("\n").length,2);
  }
});
test("missing first sentence forces explicit continuation; plan-only leaks", () => {
  for (const work of works()) {
    assert.equal(choose(work,[],"observed").surface,work.second.explicit);
    assert.equal(choose(work,[],"plan_only").surface,work.second.anaphoric);
    assert.equal(choose(work,[],"sham").surface,work.second.anaphoric);
    assert.equal(diagnostic(work).planOnlyDanglingReference,true);
  }
});
test("quoted, denied, hypothetical and merely similar text are UNKNOWN", () => {
  for (const work of works()) {
    const first=work.facts[0].variants[0];
    for (const phrase of [
      "“"+first+"”라는 말은 사실이 아니다.",
      "만약 "+first+"라고 하면 상황이 다르다.",
      first.slice(0,-1),
      first+" 하지만 확인은 되지 않았다."
    ]) {
      const state=observe(work,[phrase]);
      assert.deepEqual(state.known,[]);
      assert.equal(state.events[0].status,"UNKNOWN");
      assert.equal(choose(work,[phrase]).surface,work.second.explicit);
    }
  }
});
test("upstream replacement replays and invalidates any stale antecedent", () => {
  for (const work of works()) {
    const old=work.facts[0].variants[0];
    const changed=replaceAndReplay(work,[old],0,old+" (미확인)");
    assert.deepEqual(changed.state.known,[]);
    assert.equal(changed.next.surface,work.second.explicit);
    const recovered=replaceAndReplay(work,changed.lines,0,work.facts[0].variants[1]);
    assert.deepEqual(recovered.state.known,["F1"]);
    assert.equal(recovered.next.surface,work.second.anaphoric);
  }
});
test("KEEP exact text, bounded anaphoric fix, ABSTAIN on unknown line", () => {
  for (const work of works()) {
    const first=work.facts[0].variants[0];
    for (const second of [work.second.anaphoric,work.second.explicit]) {
      const x=assessDraft(work,[first,second]);
      assert.equal(x.decision,"KEEP");
      assert.equal(x.output,[first,second].join("\n"));
    }
    const fixed=assessDraft(work,[work.second.anaphoric]);
    assert.equal(fixed.decision,"REVISE");
    assert.equal(fixed.output,work.second.explicit);
    const unknown=assessDraft(work,["조건이 새로 생겼습니다.",work.second.anaphoric]);
    assert.equal(unknown.decision,"ABSTAIN");
    assert.equal(unknown.output,["조건이 새로 생겼습니다.",work.second.anaphoric].join("\n"));
  }
});
test("tampering with the source, variant inventory, or fact IDs fails closed", () => {
  for (const work of works()) {
    const altered={...work,source:[work.source[0]+" ",work.source[1]]};
    assert.throws(()=>validateWork(altered),/SOURCE_FACT_MISMATCH/);
    const duplicate=JSON.parse(JSON.stringify(work));
    duplicate.facts[1].id="F1";
    assert.throws(()=>validateWork(duplicate),/DUPLICATED_FACT_ID/);
    const falseLicense=JSON.parse(JSON.stringify(work));
    falseLicense.second.anaphoric="새로운 의무가 있습니다.";
    assert.throws(()=>validateWork(falseLicense),/BAD_ANAPHORIC_CONTRACT/);
  }
});
test("same surface cannot silently stand for two different facts", () => {
  const work=JSON.parse(JSON.stringify(works()[0]));
  work.facts[1].variants[0]=work.facts[0].variants[0];
  assert.throws(()=>validateWork(work),/AMBIGUOUS_SURFACE/);
});
test("duplicate realized facts remain supported but cannot count twice", () => {
  const work=works()[0],line=work.facts[0].variants[0];
  const view=observe(work,[line,line]);
  assert.deepEqual(view.known,["F1"]);
  assert.equal(view.events[1].status,"DUPLICATE");
  assert.equal(view.evidence.length,1);
  assert.equal(assessDraft(work,[line,line]).decision,"ABSTAIN");
});
test("unknown policy and malformed sentence stream never yield certified output", () => {
  const work=works()[0];
  assert.throws(()=>choose(work,[],"magic"),/UNKNOWN_POLICY/);
  assert.throws(()=>observe(work,[null]),/INVALID_REALIZED_SENTENCES/);
  assert.throws(()=>replaceAndReplay(work,[],0,"hello"),/BAD_REPLACEMENT_INDEX/);
});

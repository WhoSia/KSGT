"use strict";

const MODES = new Set(["only", "applies", "all"]);
const ALL = "모든 이용자";
const isLine = text => typeof text === "string" && text.trim() === text && text.length > 0 && !/[\r\n]/.test(text);

function validate(plan) {
  const actionTexts = Object.values(plan.actions);
  const audiences = Object.values(plan.audiences);
  if (!actionTexts.length || actionTexts.some(s => !isLine(s)) ||
      new Set(actionTexts).size !== actionTexts.length) throw Error("INVALID_ACTION_WORDING");
  if (Object.hasOwn(plan.audiences, "all") || audiences.includes(ALL) ||
      audiences.some(s => !isLine(s)) || new Set(audiences).size !== audiences.length) {
    throw Error("INVALID_AUDIENCE_WORDING");
  }
  const seen = new Set();
  for (const rule of plan.rules) {
    if (!MODES.has(rule.mode) || (rule.mode === "all") !== (rule.audience === "all") ||
        (rule.audience !== "all" && !Object.hasOwn(plan.audiences, rule.audience)) ||
        !rule.actions.length) throw Error("INVALID_SCOPE");
    for (const id of rule.actions) {
      if (!Object.hasOwn(plan.actions, id) || seen.has(id)) throw Error("UNKNOWN_OR_DUPLICATE_ACTION");
      seen.add(id);
    }
  }
  if (seen.size !== actionTexts.length) throw Error("UNBOUND_ACTION");
}

function header(plan, audience, mode) {
  const name = audience === "all" ? ALL : plan.audiences[audience];
  return `다음 절차는 ${name}에게${mode === "only" ? "만" : ""} 적용됩니다.`;
}

function render(plan) {
  validate(plan);
  return plan.rules.map(rule => [
    header(plan, rule.audience, rule.mode),
    ...rule.actions.map(id => "- " + plan.actions[id]),
  ].join("\n")).join("\n\n");
}

function recover(plan, text) {
  validate(plan);
  const supported = new Map([[header(plan, "all", "all"), { audience: "all", mode: "all" }]]);
  for (const audience of Object.keys(plan.audiences)) {
    for (const mode of ["only", "applies"]) supported.set(header(plan, audience, mode), { audience, mode });
  }
  const actions = new Map(Object.entries(plan.actions).map(([id, s]) => ["- " + s, id]));
  const recovered = [];
  let cursor = 0;
  let block = null;
  for (const line of text.split("\n")) {
    const span = [cursor, cursor + line.length];
    cursor += line.length + 1;
    if (!line) {
      if (!block || !block.items.length) return { status: "unsupported", reason: "empty_block", span };
      block = null;
      continue;
    }
    if (!block) {
      const scope = supported.get(line);
      if (!scope) return { status: "unsupported", reason: "unknown_scope_header", span };
      block = { ...scope, span, items: [] };
      recovered.push(block);
      continue;
    }
    const id = actions.get(line);
    if (!id) return { status: "unsupported", reason: "unknown_action_or_boundary", span };
    block.items.push({ id, span });
  }
  if (!block?.items.length) return { status: "unsupported", reason: "missing_action" };
  return { status: "parsed", blocks: recovered };
}

function audit(plan, text) {
  const result = recover(plan, text);
  if (result.status !== "parsed") return result;
  const expected = new Map(plan.rules.flatMap(rule => rule.actions.map((id, i) => [
    id,
    { audience: rule.audience, mode: rule.mode, before: rule.actions[i - 1] ?? null },
  ])));
  const issues = [];
  const evidence = new Map();
  for (const block of result.blocks) {
    for (const [i, item] of block.items.entries()) {
      const expect = expected.get(item.id);
      if (evidence.has(item.id)) issues.push({ kind: "duplicate", id: item.id });
      const observed = { audience: block.audience, mode: block.mode, before: block.items[i - 1]?.id ?? null };
      evidence.set(item.id, { ...observed, scopeSpan: block.span, actionSpan: item.span });
      if (observed.audience !== expect.audience) issues.push({ kind: "audience", id: item.id });
      if (observed.mode !== expect.mode) issues.push({ kind: "mode", id: item.id });
      if (observed.before !== expect.before) issues.push({ kind: "order_or_group", id: item.id });
    }
  }
  for (const id of expected.keys()) if (!evidence.has(id)) issues.push({ kind: "missing", id });
  return { status: issues.length ? "rejected" : "supported", issues, evidence: Object.fromEntries(evidence) };
}

module.exports = { render, recover, audit };

"use strict";

const MODES = new Set(["only", "applies", "all"]);
const ALL = "모든 이용자";
const isLine = text => typeof text === "string" && text.trim() === text && text.length > 0 && !/[\r\n]/.test(text);

function validate(plan) {
  const alternatives = plan.alternatives ?? {};
  if (Object.keys(alternatives).some(id => !Object.hasOwn(plan.actions, id))) throw Error("UNKNOWN_ACTION_WORDING");
  const actionTexts = [...Object.values(plan.actions), ...Object.values(alternatives)];
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
  if (seen.size !== Object.keys(plan.actions).length) throw Error("UNBOUND_ACTION");
}

function header(plan, audience, mode, format) {
  const name = audience === "all" ? ALL : plan.audiences[audience];
  const recipient = name + "에게" + (mode === "only" ? "만" : "");
  if (format === "paragraph") return recipient + " 적용되는 절차입니다.";
  return "다음 절차는 " + recipient + " 적용됩니다.";
}

function render(plan, { format = "list", alternate = false } = {}) {
  validate(plan);
  if (!["list", "paragraph"].includes(format)) throw Error("INVALID_FORMAT");
  const blocks = plan.rules.map(rule => {
    const title = header(plan, rule.audience, rule.mode, format);
    const actions = rule.actions.map(id => (alternate && plan.alternatives?.[id]) || plan.actions[id]);
    if (format === "list") return [title, ...actions.map(s => "- " + s)].join("\n");
    if ([title, ...actions].some(s => !s.endsWith(".") || s.includes(". "))) {
      throw Error("UNSUPPORTED_PARAGRAPH_PUNCTUATION");
    }
    return [title, ...actions].join(" ");
  });
  return blocks.join("\n\n");
}

function recover(plan, text) {
  validate(plan);
  const scopes = new Map();
  for (const format of ["list", "paragraph"]) {
    for (const [audience, mode] of [["all", "all"], ...Object.keys(plan.audiences)
      .flatMap(id => ["only", "applies"].map(m => [id, m]))]) {
      scopes.set(header(plan, audience, mode, format), { audience, mode, format });
    }
  }
  const actions = new Map(Object.entries(plan.actions).map(([id, s]) => [s, id]));
  for (const [id, s] of Object.entries(plan.alternatives ?? {})) actions.set(s, id);
  const blocks = [];
  let cursor = 0;
  for (const rendering of text.split("\n\n")) {
    const isList = rendering.includes("\n");
    const delimiter = isList ? "\n" : " ";
    const sentences = isList ? rendering.split(delimiter) : rendering.split(/(?<=\.) /);
    const [title, ...actionLines] = sentences;
    const span = [cursor, cursor + title.length];
    const scope = scopes.get(title);
    if (!scope || (scope.format === "list") !== isList || !actionLines.length) {
      return { status: "unsupported", reason: "unknown_scope_header_or_boundary", span };
    }
    cursor = span[1] + delimiter.length;
    const items = [];
    for (const line of actionLines) {
      const actionSpan = [cursor, cursor + line.length];
      const wording = isList && line.startsWith("- ") ? line.slice(2) : isList ? "" : line;
      const id = actions.get(wording);
      if (id === undefined) return { status: "unsupported", reason: "unknown_action_or_boundary", span: actionSpan };
      items.push({ id, span: actionSpan });
      cursor = actionSpan[1] + delimiter.length;
    }
    blocks.push({ ...scope, span, items });
    cursor += 2 - delimiter.length;
  }
  return { status: "parsed", blocks };
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
      evidence.set(item.id, { ...observed, format: block.format, scopeSpan: block.span, actionSpan: item.span });
      if (observed.audience !== expect.audience) issues.push({ kind: "audience", id: item.id });
      if (observed.mode !== expect.mode) issues.push({ kind: "mode", id: item.id });
      if (observed.before !== expect.before) issues.push({ kind: "order_or_group", id: item.id });
    }
  }
  for (const id of expected.keys()) if (!evidence.has(id)) issues.push({ kind: "missing", id });
  return { status: issues.length ? "rejected" : "supported", issues, evidence: Object.fromEntries(evidence) };
}

function reviseScope(plan, text, ruleIndex, { audience, mode }) {
  const current = audit(plan, text);
  if (current.status !== "supported") return { status: "unresolved_source", text, audit: current };

  if (!Number.isInteger(ruleIndex) || ruleIndex < 0 || ruleIndex >= plan.rules.length) {
    throw Error("INVALID_RULE_INDEX");
  }
  const selected = plan.rules[ruleIndex];
  const revisedPlan = { ...plan, rules: plan.rules.map((rule, i) =>
    i === ruleIndex ? { ...rule, audience, mode } : rule) };
  validate(revisedPlan);
  const evidence = current.evidence[selected.actions[0]];
  const span = evidence.scopeSpan;
  const [start, end] = span;
  const replacement = header(revisedPlan, audience, mode, evidence.format);
  const revisedText = text.slice(0, start) + replacement + text.slice(end);
  const checked = audit(revisedPlan, revisedText);
  if (checked.status !== "supported") throw Error("SCOPE_REVISION_MISMATCH");
  return { status: "supported", plan: revisedPlan, text: revisedText,
    change: { oldSpan: span, newSpan: [start, start + replacement.length] }, audit: checked };
}

module.exports = { render, recover, audit, reviseScope };

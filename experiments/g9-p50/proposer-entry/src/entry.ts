/** P50 source-conditioned bridge: deterministic transport only; no semantic judge. */
export interface FrozenEntryContract {
  serialized_primary_route: {
    template: string;
    task_instruction_rule: string;
    max_prompt_tokens: number;
    max_new_tokens: number;
    combined_max_context: number;
    frozen_task_map: Record<string, string>;
  };
  candidate_generation: {
    budget_per_source: number;
    candidate_indices: number[];
    seeds: number[];
    sampling: {
      temperature: number;
      top_k: number;
      top_p: number;
      repetition_penalty: number;
      frequency_penalty: number;
    };
  };
}

export type SourceHold =
  | "SOURCE_EMPTY"
  | "SOURCE_DELIMITER_COLLISION"
  | "SOURCE_TOO_LONG"
  | "UNKNOWN_FROZEN_TASK";

export interface FrozenSource {
  sourceId: string;
  text: string;
  frozenTaskInstruction?: string | null;
  frozenPacketSha256: string;
  permitsNoOp: boolean;
}

export type EntryOutcome =
  | { kind: "HOLD"; reason: SourceHold; sourceId: string; promptTokens?: number }
  | {
      kind: "READY";
      sourceId: string;
      frozenPacketSha256: string;
      prompt: string;
      promptTokens: number;
      maxNewTokens: number;
      attempts: readonly {
        index: number;
        seed: number;
        temperature: number;
        topK: number;
        topP: number;
        repetitionPenalty: number;
        frequencyPenalty: number;
      }[];
    };

export interface AttemptReceipt {
  index: number;
  seed: number;
  generatedTokens: number;
  stopReason: "EOS" | "TOKEN_LIMIT" | "ERROR";
  rawCandidateText: string | null;
}

export interface FrozenCandidatePool {
  sourceId: string;
  checkpointId: string;
  frozenPacketSha256: string;
  promptTokenCount: number;
  rawAttempts: readonly AttemptReceipt[];
  identityFlags: readonly boolean[];
  uniqueNonemptyCandidateCount: number;
  primaryCandidate: string | null;
  authority: "TRANSPORT_ONLY_NOT_PIA_CLASSIFICATION";
}

function renderTemplate(
  template: string,
  instruction: string,
  source: string,
): string {
  const task = template.split("{FROZEN_TASK_INSTRUCTION}");
  if (task.length !== 2) throw new Error("Invalid frozen task placeholder");
  const doc = task[1].split("{SOURCE_TEXT}");
  if (doc.length !== 2) throw new Error("Invalid frozen source placeholder");
  // Construct once in parts so source/task strings are never interpreted as template syntax.
  return task[0] + instruction + doc[0] + source + doc[1];
}

export function prepareSourceEntry(
  contract: FrozenEntryContract,
  source: FrozenSource,
  countTokens: (raw: string) => number,
): EntryOutcome {
  if (!source.sourceId || !source.frozenPacketSha256) {
    throw new Error("Frozen PIA provenance required");
  }
  if (source.text.trim().length === 0)
    return { kind: "HOLD", reason: "SOURCE_EMPTY", sourceId: source.sourceId };
  if (source.text.includes("【원문】") || source.text.includes("【수정문】"))
    return { kind: "HOLD", reason: "SOURCE_DELIMITER_COLLISION", sourceId: source.sourceId };

  const route = contract.serialized_primary_route;
  const spec = contract.candidate_generation;
  if (route.max_prompt_tokens !== 768 || route.max_new_tokens !== 256 ||
      route.combined_max_context !== 1024 ||
      route.max_prompt_tokens + route.max_new_tokens > route.combined_max_context)
    throw new Error("Entry context departed from preseal");
  if (spec.budget_per_source !== 4 ||
      spec.candidate_indices.join(",") !== "0,1,2,3" ||
      spec.seeds.join(",") !== "20261007,20261008,20261009,20261010")
    throw new Error("Candidate attempt budget/seed departed from preseal");
  if (spec.sampling.temperature !== 0.8 || spec.sampling.top_k !== 50 ||
      spec.sampling.top_p !== 0.95 || spec.sampling.repetition_penalty !== 1 ||
      spec.sampling.frequency_penalty !== 0)
    throw new Error("Sampling policy departed from preseal");

  const taskCode = source.frozenTaskInstruction ?? "";
  const taskMap = route.frozen_task_map;
  if (Object.keys(taskMap).length !== 2 ||
      taskMap["minimal Korean correction"] !== "오탈자와 문법 오류만 필요한 만큼 최소한으로 교정하세요." ||
      taskMap["meaning-preserving Korean paraphrase"] !== "의미를 보존하면서 원문과 표현이 다른 한국어 문장을 제시하세요.")
    throw new Error("Frozen task translation map has changed");
  if (taskCode !== "minimal Korean correction" &&
      taskCode !== "meaning-preserving Korean paraphrase")
    return {kind:"HOLD", reason:"UNKNOWN_FROZEN_TASK", sourceId:source.sourceId};
  const instruction = taskMap[taskCode];
  const prompt = renderTemplate(route.template, instruction, source.text);
  const tokens = countTokens(prompt);
  if (!Number.isSafeInteger(tokens) || tokens < 0)
    throw new Error("Invalid tokenizer token-count result");
  if (tokens > route.max_prompt_tokens)
    return { kind: "HOLD", reason: "SOURCE_TOO_LONG", sourceId: source.sourceId, promptTokens: tokens };

  const attempts = spec.candidate_indices.map((index, i) => ({
    index,
    seed: spec.seeds[i],
    temperature: spec.sampling.temperature,
    topK: spec.sampling.top_k,
    topP: spec.sampling.top_p,
    repetitionPenalty: spec.sampling.repetition_penalty,
    frequencyPenalty: spec.sampling.frequency_penalty,
  }));
  return {
    kind: "READY",
    sourceId: source.sourceId,
    frozenPacketSha256: source.frozenPacketSha256,
    prompt,
    promptTokens: tokens,
    maxNewTokens: route.max_new_tokens,
    attempts,
  };
}

function whitespaceEquivalent(a: string, b: string): boolean {
  return a.replace(/\s+/gu, " ").trim() === b.replace(/\s+/gu, " ").trim();
}

/**
 * PIA class labels are deliberately absent. No generator or transport code can
 * promote an output to ACCEPTABLE_AS_IS or LOCAL_REPAIRABLE.
 */
export function sealCandidatePool(
  source: FrozenSource,
  entry: Extract<EntryOutcome, { kind: "READY" }>,
  checkpointId: string,
  rawAttempts: readonly AttemptReceipt[],
): FrozenCandidatePool {
  if (!checkpointId || entry.sourceId !== source.sourceId)
    throw new Error("Source/checkpoint mismatch");
  if (rawAttempts.length !== 4)
    throw new Error("Every candidate attempt must have a receipt");
  const seen = new Set<string>();
  const identityFlags: boolean[] = [];
  const canonical: AttemptReceipt[] = [];
  for (let i = 0; i < 4; i++) {
    const x = rawAttempts[i];
    if (x.index !== i || x.seed !== entry.attempts[i].seed ||
        !Number.isSafeInteger(x.generatedTokens) ||
        x.generatedTokens < 0 || x.generatedTokens > entry.maxNewTokens)
      throw new Error("Attempt order/seed/token budget mismatch");
    if (x.rawCandidateText === null && x.stopReason !== "ERROR")
      throw new Error("Unaccounted empty candidate attempt");
    if (x.rawCandidateText !== null && x.stopReason === "ERROR")
      throw new Error("Error attempt unexpectedly returned candidate");
    const raw = x.rawCandidateText;
    const nonempty = raw !== null && raw.trim().length > 0;
    if (nonempty) seen.add(raw);
    identityFlags.push(raw !== null && whitespaceEquivalent(raw, source.text));
    canonical.push({ ...x });
  }
  return {
    sourceId: entry.sourceId,
    checkpointId,
    frozenPacketSha256: entry.frozenPacketSha256,
    promptTokenCount: entry.promptTokens,
    rawAttempts: canonical,
    identityFlags,
    uniqueNonemptyCandidateCount: seen.size,
    primaryCandidate: canonical[0].rawCandidateText,
    authority: "TRANSPORT_ONLY_NOT_PIA_CLASSIFICATION",
  };
}

export interface PairedArmRecord {
  proposerFamily: "SLM_AR" | "RIVAL_EDIT";
  checkpointId: string;
  sourceId: string;
  candidateSetSha256: string;
  candidateBudget: number;
  arm: "U" | "K";
}

/** Mechanically reject any U/K comparison with a switched candidate reservoir. */
export function assertFrozenPairedArms(u: PairedArmRecord, k: PairedArmRecord): void {
  if (u.arm !== "U" || k.arm !== "K")
    throw new Error("Comparison arms must be U and K");
  for (const key of ["proposerFamily", "checkpointId", "sourceId", "candidateSetSha256", "candidateBudget"] as const) {
    if (u[key] !== k[key]) throw new Error("Candidate/proposer substitution: " + key);
  }
  if (u.candidateBudget !== 4 || !u.candidateSetSha256)
    throw new Error("Incomplete candidate-set seal");
}

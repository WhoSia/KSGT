# G9-P49 Owner Repair Pilot — Blind Human Instructions

## Scope
This is a **single owner-editor mechanism pilot**, not a population study and not a native-speaker norm claim.

## What you see
For each item you see the frozen task lane, source text, and one system surface.
You do **not** see whether the surface came from A1 or A3, model scores, legality metadata, or hidden human references.

## Action
- **ACCEPT** — you would submit the shown surface as-is for this task; no repair is needed.
- **REPAIR** — you would keep it as the basis but make a local repair. Provide the **minimal final text you would actually submit**, not a stylistic rewrite for its own sake.
- **REJECT** — the surface is unsuitable for local repair under the task; you would discard it rather than repair it locally.
If the system **ABSTAINED**, do not convert that to ACCEPT/REPAIR/REJECT. It remains a separate system-coverage event.

## What not to optimize
- Do not guess which system produced the surface.
- Do not imitate an imagined reference answer.
- Do not globally polish a sentence that already satisfies the task.
- Do not treat your action as a universal Korean-language judgment.

## Optional reason tags
If useful, append one or more tags: MEANING / FACT_REFERENCE / GRAMMAR / REGISTER / WORDING / REDUNDANCY / RHYTHM / FORMAT / OTHER.
Reasons are descriptive; the primary human evidence is the action and, for REPAIR, the actual repaired surface.

## Pass discipline
Pass 1 and Pass 2 contain the same source tasks with opposite hidden system arms. Only the current pass is shown. Do not consult the other pass or hidden key before the current pass is sealed.

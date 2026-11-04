# G10-P1 Pilot 001 — Closed Failure Audit and Model Replacement (2026-11-04)

## Grounded run
- Workflow: https://github.com/WhoSia/KSGT/actions/runs/41758538941
- Trigger: human-associated WhoSia commit `cd0b6891e20612d44d40aef219eb30b047c19ad8`
- One author-generated synthetic science source work, 5 policies, model `llama-3.3-70b-versatile`
- GitHub job: **SUCCESS as infrastructure**, 58 Node tests passed, Groq secret injected.
- Downloaded artifact ID 13289966493, ZIP digest `sha256:2361ee0bdb1874b8709ca38b4d03d1218e7f9777755bf4a5bb01e12dafa27e92`.
- Parsed artifact: exactly **five FAILED arms**, each `PROVIDER_HTTP_404`; **zero real Korean passages**, no provider token usage, no reader judgments.
- No provider error response body was logged for confidentiality, so the **404 cause** was diagnosed from the official retirement notice rather than directly from a body-specific model-error message.

## Diagnosis
Groq's official deprecation ledger https://console.groq.com/docs/deprecations states `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` were discontinued for Free/Developer plans on **2026-08-16** (enterprise accounts may differ). It recommends `openai/gpt-oss-120b` or current Qwen successors as alternatives. The API path `https://api.groq.com/openai/v1/chat/completions` is confirmed in https://console.groq.com/docs/api-reference.

Our original first-model recommendation relied on an older model list and was wrong for current free/developer usage. The 404 response aligns with that cause. **Do not infer a bad API key from it:** the secret passed the presence check, but the server's exact error subtype remains unavailable.

## Corrective action
1. Replaced deprecated allowlisted models with `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b`.
2. Added low reasoning effort and suppression of reasoning traces for the supported GPT-OSS models to prioritize actual Korean prose while keeping model-specific flags off Qwen.
3. Fixed runner to return **nonzero exit code** after saving a report if one or more of the five model generations failed; the workflow's `if: always()` summary and artifact steps can still run. Hence a job SUCCESS can no longer be mistaken for five successful completions.
4. Added strict five-output verifier and regression tests that reproduce five-by-404 failure.
5. Re-run same **author-created public developmental source** with `openai/gpt-oss-120b` at fixed temperature and 1500-token completion budget. This is a new provider/model pilot, **not** evidence of an architecture improvement.

## Research lesson
Treat provider availability, execution transport, generated content, source fidelity, and native-reader quality as **five separate evidence layers**. CI pass is not generation success, and generation success is not prose-quality success. The initial failed run stays in the public audit ledger; never rewrite it into a success or silently discard unsuccessful arms.

## Status
G10-P1 OPEN. Pilot001 infrastructure pass / generation 0-of-5. Subsequent pilot pending new exact GitHub run receipt. Scientific novelty and human preference: HOLD.

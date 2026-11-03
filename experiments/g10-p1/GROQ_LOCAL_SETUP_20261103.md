# G10-P1 — GroqCloud Local Setup (2026-11-03)

**Status:** Connector implemented and mocked/tested. **No live Groq requests made.**
**User must create their own API key, confirm provider usage terms and limits, and run a private local pilot.**
**No API key in chat, Notion, GitHub commits, shell history or test fixtures.**

## 1. Why Groq?

Groq Chat Completions uses a mostly OpenAI-compatible interface:
- Base: `https://api.groq.com/openai/v1`
- `POST /chat/completions`
- API credential: `GROQ_API_KEY`
- Production models include `llama-3.3-70b-versatile`, `openai/gpt-oss-20b`, and `openai/gpt-oss-120b`. Verify the current list on the day of a run.

Primary sources:
- https://console.groq.com/docs/openai
- https://console.groq.com/docs/quickstart
- https://console.groq.com/docs/models
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/production-readiness/security-onboarding

## 2. Key creation / privacy

1. In https://console.groq.com/ create a research API key under API Keys, subject to platform requirements.
2. Inspect your plan's actual usage limits and any spend controls. Do not assume unlimited free usage.
3. Never send the key to the ChatGPT conversation or paste it into GitHub, Notion, screenshots, recordings, pull requests, logs, or research documents.
4. Do not add billing details unless you intentionally choose to do so under the applicable provider terms. For the initial pilot, check the available free quota first.
5. Keep the key as a session-only environment variable. The local environment variable is **not remotely synchronized** into the ChatGPT GitHub/Notion tools.

### Windows PowerShell from repository root

```powershell
# Enter the key privately in this terminal prompt (not in a GitHub file or this chat).
$env:GROQ_API_KEY = Read-Host "Groq API key"
node --version
node --test experiments/g10-p1/*.test.cjs
node experiments/g10-p1/paired_runner_v02.cjs --dry-run --input experiments/g10-p1/fixtures/groq_smoke_one_source.json > $null

New-Item -ItemType Directory -Force experiments/g10-p1/local | Out-Null
node experiments/g10-p1/paired_runner_v02.cjs --run --provider groq --model llama-3.3-70b-versatile --temperature 0.2 --max-tokens 850 --seed pilot-001 --input experiments/g10-p1/fixtures/groq_smoke_one_source.json --output experiments/g10-p1/local/groq_pilot_one_source.json

# Inspect the local output privately. Do not upload the raw output unless explicitly intended.
# Afterwards, remove the key from the session:
Remove-Item Env:GROQ_API_KEY
```

**PowerShell input caution:** `Read-Host` on common PowerShell installations echoes typed input. Keep the terminal private and avoid screen capture/sharing. If a masked-input method supported by your shell is available, prefer it. Closing the shell after use also clears the session-only variable.

### macOS/Linux bash from repository root

```bash
read -rs -p "Groq API key: " GROQ_API_KEY; echo
export GROQ_API_KEY
node --test experiments/g10-p1/*.test.cjs
node experiments/g10-p1/paired_runner_v02.cjs --dry-run --input experiments/g10-p1/fixtures/groq_smoke_one_source.json > /dev/null
mkdir -p experiments/g10-p1/local
node experiments/g10-p1/paired_runner_v02.cjs --run --provider groq --model llama-3.3-70b-versatile --temperature 0.2 --max-tokens 850 --seed pilot-001 --input experiments/g10-p1/fixtures/groq_smoke_one_source.json --output experiments/g10-p1/local/groq_pilot_one_source.json
unset GROQ_API_KEY
```

## 3. What this run does and does not demonstrate

- **Scope:** one author-created science source-work × five generation policies = five requested model calls.
- **Outputs:** local JSON, all prompts and completion text, actual model name if returned, usage and per-request latency, failure class. Do not put output JSON under version control.
- **No automatic human quality scores:** generated text must be read by people and independently checked against the source brief.
- **No proof of generalization:** the source task is a development fixture visible to the researcher.
- **No automatic retries:** if rate-limited (HTTP 429) or a model is not available, the failed arm is recorded, not silently dropped. Check the current Groq limits, use a smaller smoke or change the permitted model as appropriate; do not assume it passed.

## 4. Diagnostics (only after real generations exist)

```powershell
node experiments/g10-p1/summarize_run_v03.cjs --cohort experiments/g10-p1/fixtures/groq_smoke_one_source.json --generation experiments/g10-p1/local/groq_pilot_one_source.json --output experiments/g10-p1/local/groq_pilot_diagnostic.json
```

This creates **unrated** numeric-source and experiment-completeness diagnostics. It cannot establish literary naturalness or meaning preservation.

If you want a token-price estimate, create your *own private* JSON with `promptUsdPerMillion` and `completionUsdPerMillion` from current provider pricing, and pass `--rates PRIVATE_RATES.json`; never silently apply outdated prices.

## 5. Provider hygiene

The code uses **explicit** `--provider groq` and reads only `GROQ_API_KEY`. The OpenAI API credential, if present, is not used for Groq. The adapter posts only to the hard-coded official Groq API HTTPS origin. It does not use arbitrary supplied URL endpoints, and does not print the response body's error messages (which might echo private content).

Groq notes that temperature=0 is converted to a tiny positive value. For the first pilot use 0.2; report exact settings and model IDs rather than claiming deterministic decoding.

**Next research step:** independently inspect five resulting Korean paragraphs against the original source, then compare the full three-work 15-condition pilot and decide whether the planner materially improves actual prose or merely lengthens prompts.

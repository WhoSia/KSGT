# G9-P56 — Contextual Antecedent Adjudication, Discourse Scope & Uncertainty Calibration
**User-confirmed title. Stage evidence level:** bounded typed source and set-witness court, not independent Korean coreference accuracy.

Run `node --test experiments/g9-p56/antecedent_set_court/tests/*.test.cjs` using preexisting Node.js 22. No npm install, Python, third-party dependencies, neural models, borrowed server or raw NIKL data.

`adjudicator.cjs` takes structured target, preceding sources and group claims with explicit `scope_key`, `block_key`, `attachment_key`, source/target position, a unique exact source quote and strict count/counter compatibility. This is a *declared evidence frame*, not an NLP model independently reading Korean prose. Outputs a **candidate hypothesis set** with per-candidate rejection reasons and author-controlled KEEP/CLARIFY/CONTEXTUAL decision boundaries. It refuses false uniqueness from identical surface text attached to two different source identities. It never selects or rewrites automatically and never exposes a full passage in its receipt.

**Calibration boundary:** outputs `probabilities:null`, `NOT_CALIBRATED`, `UNIDENTIFIABLE_WITHOUT_INDEPENDENT_ANTECEDENT_GOLD`. Passing a caller-generated label does not create an independent human gold row; the true referents of the 25 NIKL `그중` contexts are still unverified. Eighteen tests are authored synthetic structural controls, not 18 natural language annotation trials.

Direct historical source links and explicit old-vs-new claim audit in [HISTORICAL_CROSSWALK.md](./HISTORICAL_CROSSWALK.md).

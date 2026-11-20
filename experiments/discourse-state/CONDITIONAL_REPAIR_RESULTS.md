# R9.39 — Conditional paragraph repair and explicit defect feedback

## A. Determine what can be repaired

Six matched pairs of authored Korean drafts share a source within each pair. The test has six clean drafts, four with second-sentence defects, and two for which the first sentence must change. Three briefs reuse scenarios from earlier experiments. Freeze 19096b1a2d5af6bdac35f9a33e817dcad68d91e0. [Run 44802984902](https://github.com/WhoSia/KSGT/actions/runs/44802984902), execution d555e95c6de405763c56e86f876c575d943adb04. All 27 model calls completed normally: 12 detect, 12 whole rewrite, three conditional local generation calls. Same GPT-OSS 20B, temperature zero. The original first-stage plan matched byte for byte. All prompt and response hashes, attempt identities and result identities matched. The provider ZIP digest is 9d7fb598096a4d71db5319c3cb35741d582c0e6b2321b9fff4aba372b8afffe6.

| Output | Required relation and targeted source facts clear / 12 | Unclear / definite loss | Clean drafts unchanged / 6 | Editing tokens |
| --- | ---: | ---: | ---: | ---: |
| Initial text, retain | 6 | 2 / 4 | 6 | 0 |
| Detect, then edit sentence two when requested | 6 | 3 / 3 | 5 | 9,274 |
| Rewrite both sentences | 8 | 3 / 1 | 3 | 7,097 |

A single author performed the diagnostic reading. Counts in this table are not reader judgments or format scores. In a separate layout check, one full rewrite contained two sentences on its second line. The two cases that benefited from full rewriting initially had a first-line defect. The WINDOW rewrite corrected the window state but repeated the glove removal. The correct relation and targeted fact score is not a complete quality score.

The automatic judgment selected the intended action in 9/12 drafts. It sent 2/4 locally repairable cases to repair, held back both prefix-defective cases, and unnecessarily edited one of six clean cases. The source-defined scope still did not become clear in NUMBER after repair. In MAP the phrase claiming a different person was removed, but explicit identity binding was still missing. Both outputs satisfied the literal patch-acceptance contract. The KEY notice never reached repair because the detector held it. LABEL was deemed safe to keep. Neither editing workflow fully recovered any of the four locally repairable relationships in this sample.

Detect alone consumed 7,670 tokens across the twelve drafts. Even without any follow-up calls, that exceeds the 7,097-token whole-rewrite reference. The entire conditional edit path cost 30.7% more. This is editing overhead from identical drafts. It excludes initial writing and gives no general inference about system-wide cost.

## B. Provide the location and type of defect

Repeat all four locally repairable cases with forced attempts. Hold the initial draft, immutable first sentence, protected phrase and source fixed. Only the annotated prompt adds a human-supplied explanation of the specific defect and what relation to re-establish. Freeze 441bff7ef017be5e69518eb53acd9ca2515091a2. [Run 44803319348](https://github.com/WhoSia/KSGT/actions/runs/44803319348), execution f8e858adab945b7d5a71448434da543d336da41c. All 8 calls completed normally. The provider ZIP digest is cb7168eeeb205ec795c1450f4d38ad1ee787d61f4dee57381d367fcd8a4a128b.

| Local condition | Complete relation restored | Partial / still unclear / definite loss | Protected phrase retained | First sentence changed |
| --- | ---: | ---: | ---: | ---: |
| Generic local request | 0/4 | 0 / 3 / 1 | 4/4 | 0/4 |
| Highlight the defect and intended relation | 2/4 | 1 / 1 / 0 | 4/4 | 0/4 |

NUMBER explicitly included both procedures and the applicable group. LABEL explicitly linked Eunchae to the earlier person, with stiff wording. The notice in KEY placed both actions under the evening-practice subject but did not say the obligations applied only to that group. Both MAP arms wrote the same sentence and still left the actor link implicit. Generic prompts in NUMBER and MAP matched the earlier local requests by hash. NUMBER's wording changed on replay and MAP's did not. The targeted condition supplies human annotations for already-seen cases and does not establish automatic defect detection, reader preference, or generalization.

## Design decision

McKeown (1985), §§3.2.6–3.2.10 and 5.5, suggests keeping track of the actual focused referent and what has been expressed, not merely the intended content. Hovy (1988), §§7.3–7.4, allows a realization decision to depend on unmet goals. Mann & Thompson (1988), §§2.3 and 3, distinguish a discourse relation from its surface cue and allow alternative textual orderings. These motivate a representation of the goal and what in a candidate supports it.

For a notice, separate an action list from the group bound to those actions and the qualifier of exclusivity. For a literary passage, identify both events and preserve the identity binding independently of whether a name is repeated. If a fixed prefix already contradicts the source or reveals a timed fact too early, that release schedule or fact cannot be repaired from the second sentence. If the latter text merely leaves the identity implicit, the reader's likely interpretation remains a separate measurement.

Do not promote the standalone model detector to default. Test a cheaper alternative in which the generator preserves action and entity IDs and emits candidate-specific supporting spans. Verify which participant performs each action and which actions each condition restricts before accepting a local candidate. KRC's existing construction and subject-resolution examples are a finite executable comparator, not evidence of open-text naturalness. Run that comparison on fresh work before reusing the 2/4 outcome as a broader claim.

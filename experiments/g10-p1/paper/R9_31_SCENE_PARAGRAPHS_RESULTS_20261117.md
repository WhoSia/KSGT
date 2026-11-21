# R9.31 — Scene Endings under Fixed and Free Paragraph Counts

2026-11-17 KST. Six paired scene briefs, one Groq GPT-OSS 20B output per condition per brief, temperature 0, maximum 1,450 completion tokens. The pair changes only the words 세 문단의 in the system prompt. GATE and ENVELOPE are exposed R9.30 direct prompt replays. COIN, LIGHT, KEY and LETTER were frozen before execution.

- Code and protocol freeze: 93ff0ccb02b8e6ab98bb011d043ec2ef7f085ac8
- Execution head: 882c2d37eaa5493540806ad96803741bdd52e05c
- GitHub Actions run: https://github.com/WhoSia/KSGT/actions/runs/44044603104
- Raw artifact: 14311490048, 19,192 bytes, SHA-256 b96e8301a83119adecc8b498a1d82ca3e60949841807a464fb8535b89c338496
- Exact local/remote safe plan match. Plan hash 4253fb8b6d5c2de24bcb35605ef041c14fba7611149d7932434b1f5d6f3d8508. Twelve planned requests, attempt markers, result records and text hashes reconciled. All twelve generated. Local tests 30/30.

## Researcher review

Condition names removed and order shuffled within each brief before coding. Visible blank lines can reveal the condition. The review is the researcher's own. Ambiguous results are recorded and excluded from strict successes. The two paragraph formats are rendered using blank-line boundaries.

| Measure | Fixed three | Free count |
| --- | ---: | ---: |
| Responses that have exactly three paragraphs | 4/6 | 0/6 |
| Responses that have one blank-line-delimited paragraph | 0/6 | 6/6 |
| Overt closing/focus explanation | 2/6 with 1 ambiguous | 0/6 |
| Final licensed beat is the final narrated event | 1/6 with 1 ambiguous | 4/6 with 1 ambiguous |
| Core sequence and actors retained | 2/6 with 1 ambiguous | 3/6 with 1 ambiguous |
| Clear material source additions or changes | 5/6 | 3/6 with 1 ambiguous |
| Core sequence and final beat retained with no material breach | 1/6 | 1/6 |
| Total characters | 1,748 | 1,204 |
| Total provider tokens | 3,356 | 2,983 |

The prespecified strict clean-improvement test conditions on a pair with overt commentary in one arm and asks whether the other arm removes it while retaining the source sequence and ending without material breach. Neither direction had a clean improvement. In COIN and LETTER, the free arm removed overt commentary but added a new sound or action. The free LIGHT preserved the whole sequence, whereas fixed LIGHT placed a new action after the final beat. This is a secondary concrete improvement, without overt meta-commentary in the fixed LIGHT response. Fixed KEY retained the sequence and ending and avoided material additions, but repeated the source fragment 문을 엶 as malformed prose. Free KEY did the same and made the meeting order unclear. Thus isolated quality dimensions diverge.

For the two repeated briefs, fixed/free character counts were 397/118 and 228/133. The two new short briefs were 317/197 and 250/153. In both new ten-beat briefs, free was slightly longer (218/257 and 338/346). A lower aggregate character count does not explain those within-brief results. In GATE the free text used language like 잡음이 느껴졌다 and 문고리를 한 번 덜컥 소리쳤다, breaking the prose and leaving the event uncertain. In LIGHT the free output stops on the light left on the floor. A separately coded conspicuous prose flaw was absent in that free LIGHT response, while fixed KEY still had the unconverted fragment. This is qualitative, not an independent naturalness endpoint.

## Consequences

Give the model control of paragraph count as a candidate for short scenes. The evidence concerns the effect of removing one instruction, not a rule that one paragraph is inherently better. Preserve "no clean improvement" as the decision under the prespecified strict endpoint. A follow-up can use the stronger one-call draft as a common starting point across both a plain continuation and a choice constrained by the final beat, without forcing the draft to restate the source. Judge with and without the revision and retain cases where the added model step erases rhythm or removes facts. Keep future evaluator labels independent of paragraph form if possible, and report any cues that reveal conditions. No reader preference, broad model effect, or inference about long literary work follows from six briefs.

[Drive evidence ZIP](https://drive.google.com/file/d/1pam2JNxdmMyYRnzNR_VzqZe14VPsHC8X/view). Readback SHA-256: cb947b1d5827e1fd6b4873615c56ca0eae14c5abc29801c44e2b6a0b7a7963e8.

# R9.36 — Choice from Korean passages and extracted discourse state

The freeze is e41dda91feb464eef80bc9bff82dc9ca47e486bc. The run used 5497ab208b6c683b551b122827c84f84334cd97b with Groq GPT-OSS 20B at temperature zero. [Run 44786126747](https://github.com/WhoSia/KSGT/actions/runs/44786126747), artifact 14653244063. Its downloaded ZIP matches the provider digest, b557c567d16dd8e487445e8e69b4556b1e5a2c28a9f73e4b4bb711cffe6cd7b6. The local and CI plan files match byte for byte. All 36 planned identities, attempt hashes, text hashes and finish reasons verified. All 64 Node checks in g10-p1 and discourse-state passed locally.

| Arm | Correct / 12 | Both variants correct / 6 | Safe omissions / 6 | Unsafe omissions / 6 | Request and response tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| Full passage → model chooses | 6 | 1 | 5 | 5 | 3,995 |
| State from annotated events → model chooses | 10 | 4 | 6 | 2 | 3,405 |
| Full passage → model extracts state → code chooses | 10 | 4 | 5 | 1 | 4,918 |
| State from annotated events → code chooses | 12 | 6 | 6 | 0 | — |

An extra task or person can be located in the passage without becoming available to the intended reader. In HANDOVER_B, the recipient saw an old schedule with two possible custodians. The extractor returned only Minji and the final form wrongly omitted her name. In NEW_LISTENER_A, the extractor returned the caller's name in place of the person being discussed, causing an unnecessary explicit name. In QUOTED_B, QUOTE_RETURN_B and REOPEN_B, the extractor returned null for a known two-member set. The controller chose the requested form but did so for the wrong represented state. Exact state matches are 6/12.

The state-fed model still wrongly omitted a name for two distinct states: known competitors in SECOND_REPLY_B and no usable state in NEW_LISTENER_B. These inputs expose errors in selection after state computation. The extract arm has a different model task, public candidate list, and output contract. The complete automatic path consumed 23.1% more model tokens than the full-passage baseline. The curated state arm reduces total tokens by 14.8% with manual annotation and computation omitted from the token bill.

These are one-model diagnostic outcomes on synthetic author-built contrasts. The annotated states deliberately carry the information needed by the rule. The results neither estimate real-reader interpretation nor establish an architecture-level language-quality advantage. The scoring target is stipulated omission admissibility and use. It does not treat explicit wording as universally inferior in the six permissive examples.

Next: preserve unknown, ambiguous, and known-unique states, require evidence for ruling out candidates, and compare two alternative writing plans with a controlled disclosure-time change. We need editing and composition evidence on new paragraphs. Add a strong Korean-specific centering comparator before generalizing the omission result: [Roh & Lee 2003](https://aclanthology.org/U03-1004/) and [Roh, Na & Lee 2005](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001186230).

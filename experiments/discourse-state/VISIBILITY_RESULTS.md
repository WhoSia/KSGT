# R9.38 — First-call visibility with matched scope instructions

Six cases generated three ways on GPT-OSS 20B at temperature zero. Three are notices and three are scenes. Two are adaptations of R9.37 and four briefs are new. Freeze d84fcdef365e6649367851a9a955e9f93f79210c. Execution b56beb7beaec0e816cf44836c75d466715775dd4, [run 44800338131](https://github.com/WhoSia/KSGT/actions/runs/44800338131), artifact 14661840847. All 30 calls completed normally. Initial plans match byte for byte. Attempt and result identities, prompt and text hashes, and finish reasons were confirmed for 18 first-phase and 12 second-phase calls. The downloaded provider ZIP matches ce65c38446adc84ad80ea826efe2c2cd5d42ac870c0cf7e3890fe5b3fa4dd23f.

| Condition | Requested two lines / 6 | Premature reveal marker / 6 | Protected phrase retained / 6 | Relation preserved / unclear / loss | Total model tokens |
| --- | ---: | ---: | ---: | --- | ---: |
| One call, sentence plan | 6 | 0 | 6 | 1 / 4 / 1 | 2,946 |
| Two calls, later fact withheld from the first | 6 | 0 | 6 | 3 / 3 / 0 | 5,431 |
| Two calls, later fact shown in the first | 5 | 1 | 6 | 4 / 2 / 0 | 5,936 |

Relations were screened by a single investigator: either explicit shared actor for the story, or exclusive coverage of both actions in the notice. Where a same-actor reading is plausible but underspecified, the screen records unclear. This is stricter than ordinary reading and is not a reader judgment. A post-hoc punctuation check finds two sentences in 5/6, 6/6, and 5/6 respectively. Checking those two sentences, later disclosure, phrase retention, and explicit relation together gives 0/6, 3/6, and 3/6. Neither exact phrase preservation nor a clean line structure validates general factual fidelity.

## Informative comparisons

- RETURN supplied the only exposure-associated premature reveal. When shown the fact, the first call described the key return and also disclosed the evening-practice restriction on a second line. The follow-up repeated the restriction. When the first call could not see it, the completed notice introduced the restriction on line two and explicitly covered both obligations. The single-call reference instead attached the condition to the entry in the log, leaving its scope over the key return unsupported.
- The prefix and both second prompts were byte-identical across the staged arms for 5/6 works. HALL and NOTE nevertheless returned different second texts. In NOTE only one variant explicitly stated that the person was the same. Downstream differences under identical requests cannot be assigned to exposure based on this run.
- The two staged arms preserve explicit scope on all three notices. Repeating the request per sentence spends more tokens. The withheld arm used 84.4% more than the one-call reference. The one-call reference differs in interaction and cannot identify a visibility effect. A single short run does not estimate how often premature disclosure happens.

## Next development

McKeown (1985), §§3.2.6–3.2.10 and 5.5, motivates recording which referent and fact a generated sentence actually carries. Hovy (1988), §§7.3–7.4 and Appendix A, motivates asking the realizer for a local choice when current text cannot meet an active goal. A useful next comparison is the one-call planner plus conditional repair versus unconditional staged generation. Invoke repair only when the scope over actions or the same-person link becomes uncertain or when the requested order fails. Report reader comprehension, repairs taken, factual changes from repair, and total tokens. Repeat identical requests to measure variability. Keep the model request receipt and the reader's interpretation as different observations.

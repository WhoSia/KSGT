# R9.32 — Whole-scene and Last-two-sentence Revision

The six matched drafts were selected after the earlier R9.31 results. Groq GPT-OSS 20B returned 12/12 completions with finish reason stop. The shared payload included the source and the whole original in both revision arms. The suffix arm replaced only the last two sentences, and its preceding text was restored byte for byte. The original is the zero-call reference. Each draft/arm has one generation. Review labels were shuffled within each draft before coding. The single investigator had seen R9.31, and prefix overlap could reveal the arm. No independent reader preference was measured.

- Protocol freeze b9186fd8b39071d98851e96294a60e821ef784f8.
- Execution c6174c587f624f3f473b95dd4b5b264f94f4af1d. Run [44048125344](https://github.com/WhoSia/KSGT/actions/runs/44048125344).
- Artifact 14312930316, 19,813 bytes, SHA-256 67f28dd76789095a1430a28d1e2dc616ce62dc5966bda8b086e04aecee4cceba.
- Local and remote safe-plan bytes match. Internal plan hash 85ff51c483315e1e29f022cd173969c22c28457eb3f65d3389dc05ca020b20fe. All 12 attempt markers, prompt hashes, original-draft and prefix hashes, and response hashes verified. Regression checks 32/32.

| Outcome | Original | Whole | Suffix |
| --- | ---: | ---: | ---: |
| Removed diagnosed end commentary (COIN and LETTER) | 0/2 | 2/2 | 2/2 |
| Removed extra final movement (LIGHT fixed) | 0/1 | 1/1 | 0/1 |
| Stopped on the source's last event | 2/6 | 5/6 | 4/6 |
| Correct core sequence and end, with no material breach or conspicuous prose error | 1/6 | 1/6 | 1/6 |
| Exact original retained | 6/6 | 2/6 | 0/6 |
| Provider completion tokens | 0 | 1,046 | 841 |

LIGHT free was the only text in each arm to meet all conditions. The whole revision kept it byte-for-byte. The suffix arm joined the last two sentences on one line and changed 남아 있었다 to 남았다, without changing the scene. The whole revision also returned GATE unchanged. It flattened some paragraph breaks without fixing KEY's malformed 문을 엶. The suffix revision could not reach that clause, and in GATE it turned the final sound into a sentence fragment.

In COIN both edits removed the explanation of the shifting viewpoint, while the earlier door closing, breathing, and light reflection remained. In LETTER the end returned to the single water drop, while the description of two empty seats and a person sitting next to the narrator remained, and the library was still omitted. In LIGHT fixed the whole revision removed the extra final movement but left the contradictory sequence in which the light was already on the floor and disappeared as the door closed. Restricting writes to the ending gives exact preservation of the beginning. It offers no repair for a defective beginning. Whole access is necessary for certain repairs and was insufficient for each affected draft here.

Next contrast should intervene on the brief and the editable area independently. In GATE, rewrite the ambiguous source noun 잡음 as the explicit action 문을 안쪽으로 열어 잡고 있음, and in KEY rewrite 문을 엶 as an ordinary finite clause. Evaluate source wording with fixed events and measure both generation from scratch and editing the same flawed draft. Keep a clean draft to estimate needless edits. Record source-note transcription separately from end commentary.

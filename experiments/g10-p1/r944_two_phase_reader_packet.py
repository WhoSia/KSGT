"""Repackage sealed R9.34 Korean writing outputs for two distinct evaluation phases.

Stage A hides the investigator's source fact inventory and arm identity.
Stage B exposes that inventory for a separate source audit. Both use the same
archived texts. No evaluation or preference is invented by this generator.
"""
import argparse
import hashlib
import io
import json
import zipfile
from collections import Counter
from pathlib import Path

ARMS = {"direct", "rich", "guided"}

def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def json_member(archive, filename):
    return json.loads(archive.read(filename))


def read_evidence(archive_file):
    with zipfile.ZipFile(archive_file) as outer:
        if outer.testzip() is not None:
            raise ValueError("invalid outer ZIP")
        plan = json_member(outer, "r934-plan.json")
        key = json_member(outer, "R934-reader-packet/investigator-key.json")
        with zipfile.ZipFile(io.BytesIO(outer.read("R934-provider.zip"))) as inner:
            if inner.testzip() is not None:
                raise ValueError("invalid provider ZIP")
            expected = {c["id"]: c for c in plan["cells"]}
            if len(expected) != 36 or len(plan["cells"]) != 36:
                raise ValueError("expected 36 unique cells")
            if set(c["condition"] for c in expected.values()) != ARMS:
                raise ValueError("arm mismatch")
            summary = json_member(inner, "r934-run/summary.json")
            if summary["planHash"] != plan["planHash"]:
                raise ValueError("run-plan mismatch")
            results = {}
            for ident, cell in expected.items():
                a = json_member(inner, f"r934-run/{ident}.attempt.json")
                r = json_member(inner, f"r934-run/{ident}.result.json")
                if (a["id"] != ident or r["id"] != ident or
                    a["planHash"] != plan["planHash"] or
                    a["promptSha256"] != cell["promptSha256"] or
                    r["promptSha256"] != cell["promptSha256"] or
                    r["sourceWork"] != cell["sourceWork"] or
                    r["condition"] != cell["condition"] or
                    r["outcome"] != "GENERATED" or r["finishReason"] != "stop" or
                    not r.get("text") or digest(r["text"]) != r["textSha256"]):
                    raise ValueError("receipt or response mismatch: " + ident)
                results[ident] = r["text"]
            # No missing/extra response receipts may be hidden by a valid subset.
            suffixes = (".attempt.json", ".result.json")
            for suffix in suffixes:
                present = {p.rsplit("/", 1)[-1][:-len(suffix)] for p in inner.namelist()
                           if p.startswith("r934-run/") and p.endswith(suffix)}
                if present != set(expected):
                    raise ValueError("unaccounted response receipts")
    return plan, key, results


def cards_for_form(key, results, cohort, number):
    cards = key[str(number)]
    if len(cards) != 12 or len({c["work"] for c in cards}) != 12:
        raise ValueError("form must contain 12 distinct works")
    if {c["work"] for c in cards} != set(cohort):
        raise ValueError("form work mismatch")
    positions = Counter()
    out = []
    for index, c in enumerate(cards, 1):
        if c["number"] != index:
            raise ValueError("form numbering mismatch")
        work = cohort[c["work"]]
        ids = [c["A"], c["B"]]
        if (len(set(ids)) != 2 or any(i not in results for i in ids) or
            any(not i.startswith("R934_" + c["work"] + "_") for i in ids)):
            raise ValueError("bad A/B references")
        arms = [i.rsplit("_", 1)[-1] for i in ids]
        if not (set(arms) in ({"direct", "guided"}, {"rich", "guided"})):
            raise ValueError("unexpected arm comparison")
        positions[tuple(arms)] += 1
        out.append((work, c, results[ids[0]], results[ids[1]]))
    if len(positions) != 4 or set(positions.values()) != {3}:
        raise ValueError("unbalanced presentation")
    return out


def generate(archive, cohort_path, output_dir):
    plan, key, responses = read_evidence(archive)
    works = json.loads(Path(cohort_path).read_text(encoding="utf-8"))
    cohort = {w["id"]: w for w in works}
    if len(cohort) != 12 or len(works) != 12:
        raise ValueError("invalid source work count")
    expected = {(w, arm) for w in cohort for arm in ARMS}
    if {(c["sourceWork"], c["condition"]) for c in plan["cells"]} != expected:
        raise ValueError("incomplete work-arm crossing")
    output = Path(output_dir)
    if output.exists():
        raise FileExistsError("refuse to overwrite existing packet")
    a = output / "reader-stage-A"
    b = output / "source-auditor-stage-B"
    private = output / "researcher-private"
    for folder in (a, b, private):
        folder.mkdir(parents=True, exist_ok=True)
    stage_a_intro = [
        "# 한국어 완성문 읽기 — A단계", "",
        "독립적으로 글 두 편을 읽고 판단하세요. 이 단계에서는 연구자가 가진 원천 사실 목록을 보지 않습니다.",
        "다른 단계의 자료와 정답표는 읽기 전에 열지 마세요. A/B는 임의 표기이며 생성 방식이 아닙니다.",
        "두 글이 비슷하거나 모두 사용하기 어렵다고 답할 수 있습니다. 이유와 먼저 고칠 곳을 자유롭게 적으세요.",
    ]
    stage_b_intro = [
        "# 원천 충실도 감사 — B단계", "",
        "이 단계는 원천 사실 목록을 공개합니다. 가능하면 A단계 독자와 다른 사람이 감사하고, 답안 키는 보지 마세요.",
        "단어의 존재만으로 사실 보존을 판정하지 말고, 대상·조건·배타성·인과·시간·행위자 관계를 확인하세요.",
        "문학 장면은 필수 사건과 허용 가능한 질감 묘사를 구분하며, 원문에 없는 모든 감각 표현을 자동 오류로 세지 않습니다.",
    ]
    for number in range(1, 5):
        cards = cards_for_form(key, responses, cohort, number)
        A, B = list(stage_a_intro), list(stage_b_intro)
        for ix, (work, record, text_a, text_b) in enumerate(cards, 1):
            intro = [f"## 문항 {ix}", "", work["request"], "", "**독자:** " + work["audience"]]
            body = ["", "### 글 A", "", text_a, "", "### 글 B", "", text_b]
            A += ["", *intro, *body, "", "**이 글만 읽고 답할 질문:** " + work["question"],
                  "", "- 글 A에서 이해한 답(또는 알 수 없음):", "- 글 B에서 이해한 답(또는 알 수 없음):",
                  "- 그대로 쓰거나 전달할 글: A / B / 비슷함 / 둘 다 어려움 / 판단 어려움",
                  "- 가장 먼저 고칠 곳과 그 이유(없어도 됨):",
                  "- 두 글 중 사실·약속·확신이 달라 보이는 부분(있다면):"]
            B += ["", *intro, "", "### 작성자가 제공한 원천 사실", "",
                  *[f"- {fact}" for fact in work["facts"]], *body,
                  "", "**원천을 대조해 볼 질문:** " + work["question"],
                  "", "- 글 A: 보존 / 모순 / 새로운 의무·원인·사건 / 중요한 생략 / 불확실 (근거 구절):",
                  "- 글 B: 보존 / 모순 / 새로운 의무·원인·사건 / 중요한 생략 / 불확실 (근거 구절):",
                  "- 원천 사실별 대조와 오류 위치:",
                  "- 독자 오해 가능성이 생기는 적용 범위·지시 대상:",
                  "- 문학 글감이면 원천에 없는 서술이 필수 사건을 바꾸는지, 단순 질감인지 구분:"]
        (a / f"form-{number}.md").write_text("\n".join(A) + "\n", encoding="utf-8")
        (b / f"form-{number}.md").write_text("\n".join(B) + "\n", encoding="utf-8")
    (private / "investigator-key.json").write_text(json.dumps(key, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    (private / "run-manifest.json").write_text(json.dumps({
        "sourcePlanSha256": plan["planHash"], "sourceWorkCount": 12,
        "uniqueGeneratedTexts": 36, "forms": 4, "pairsPerForm": 12,
        "independentReaderRatings": 0,
        "caveats": ["four forms reuse the same 12 works", "source facts are author-provided", "reader and auditor must be separately sampled"],
    }, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    return output


def main():
    p = argparse.ArgumentParser()
    p.add_argument("archive", type=Path)
    p.add_argument("cohort", type=Path)
    p.add_argument("output", type=Path)
    a = p.parse_args()
    print(generate(a.archive, a.cohort, a.output))

if __name__ == "__main__":
    main()

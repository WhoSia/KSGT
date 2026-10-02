#!/usr/bin/env python3
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import zipfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("nikl_stream_audit", HERE / "nikl_stream_audit.py")
m = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(m)

assert m.parse_date("20221129")[1] == "PRE_CHATGPT_2020_2022_11_29"
assert m.parse_date("20221130")[1] == "TRANSITION_2022_11_30_2023"
assert m.parse_date("20230101")[1] == "TRANSITION_2022_11_30_2023"
assert m.parse_date("20240101")[1] == "POST_2024_MIXED_PROVENANCE"
assert m.parse_date("2022")[1] == "UNSUPPORTED_DATE_SHAPE"
assert m.newspaper_provenance("NEWS_2009_2018", 2018) == "INSTITUTIONAL_EDITORIAL_PRE_CHATGPT"
assert m.newspaper_provenance("EARLY_DIGITAL_2000_2008", 2008) == "UNKNOWN"
assert m.newspaper_provenance("NEWS_2019", 2019) == "INSTITUTIONAL_EDITORIAL_PRE_CHATGPT"
assert m.newspaper_provenance("PRE_CHATGPT_2020_2022_11_29", 2022) == "INSTITUTIONAL_EDITORIAL_PRE_CHATGPT"
assert m.newspaper_provenance("TRANSITION_2022_11_30_2023", 2022) == "UNKNOWN"
assert m.newspaper_provenance("POST_2024_MIXED_PROVENANCE", 2024) == "POST_2024_AI_ASSISTANCE_UNKNOWN"
assert m.markers("또한 그리고")[0]["EXPANSION"] == 3  # exact frozen substring-count semantics

raw = json.dumps({
    "id": "corpus-shard",
    "metadata": {"year": 2024},
    "document": [
        {"id": "a1", "metadata": {"date": "20240101", "publisher": "P1", "topic": "T1"},
         "paragraph": [{"id": "s1", "form": "그러나 그래서 그리고"}]},
        {"id": "a2", "metadata": {"date": "20221130", "publisher": "P1", "topic": "T2"},
         "paragraph": [{"id": "s2", "form": "하지만 또"}]},
    ],
}, ensure_ascii=False).encode("utf-8")
docs = list(m.JsonStream(io.BytesIO(raw), chunk_size=7).root_documents())
assert [x["id"] for x in docs] == ["a1", "a2"]
groups = {}
for doc in docs:
    m._add_document(groups, doc, "JSON_PARAGRAPH_FORM", set())
assert groups[("POST_2024_MIXED_PROVENANCE", 2024, "P1")]["documents"] == 1
assert groups[("TRANSITION_2022_11_30_2023", 2022, "P1")]["documents"] == 1
finalized = [m._finalize(v, True) for v in groups.values()]
assert all("text" not in row and "form" not in row for row in finalized)
assert sum(t["text_units"] for row in finalized for t in row["topic_features"]) == 2

with tempfile.TemporaryDirectory() as tmp:
    csv_zip = Path(tmp) / "written.csv.zip"
    csv_data = ("file_id,doc_id,publisher,date,topic,sentence\n"
                "f1,d1,P1,20220000,T1,first sentence\n"
                "f1,d1,P1,20220000,T1,second sentence\n"
                "f1,d2,P1,20200102,T2,third sentence\n")
    with zipfile.ZipFile(csv_zip, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("rows.csv", csv_data)
    csv_result = m.process_csv_archive(csv_zip, True)
    invalid = next(v for k, v in csv_result["groups"].items() if k.startswith("INVALID_CALENDAR_DATE|"))
    assert invalid["documents"] == 1
    assert invalid["text_units"] == 2
    assert invalid["date_errors"] == {"INVALID_CALENDAR_DATE": 1}
    assert invalid["date_shapes"] == {"YYYYMMDD": 1}
    assert invalid["topic_features"][0]["topic"] == "T1"
    assert invalid["topic_features"][0]["documents"] == 1
    assert invalid["topic_features"][0]["text_units"] == 2

def cell(n, counts):
    edf = {c: counts.get(c, 0) for c in m.EDF}
    markers = {c: {x: counts.get(c, 0) if x == m.EDF[c][0] else 0 for x in ms}
               for c, ms in m.EDF.items()}
    return {"documents": n, "text_units": n, "edf": edf, "markers": markers,
            "topic_features": [{"topic":"topic-A", "documents":n, "text_units":n,
                                "edf":edf, "markers":markers}]}

files = [
    {"name":"a.zip","source_family":"NIKL_NEWSPAPER","serialization":"CSV",
     "groups":{"PRE_CHATGPT_2020_2022_11_29|2020|P1":cell(10,{"CONTRAST":10}),
               "TRANSITION_2022_2023|2020|P1":cell(4,{"TEMPORAL":4})}},
    {"name":"b.zip","source_family":"NIKL_NEWSPAPER","serialization":"CSV",
     "groups":{"PRE_CHATGPT_2020_2022_11_29|2021|P1":cell(10,{"CONTRAST":5,"CAUSE_RESULT":5})}},
    {"name":"c.zip","source_family":"NIKL_NEWSPAPER","serialization":"CSV",
     "groups":{"PRE_CHATGPT_2020_2022_11_29|2023|P1":cell(10,{"TEMPORAL":10})}},
]
drift = m.drift_tables(files)
assert len(drift["annual_adjacent_calendar_year_pairs"]) == 1
assert drift["annual_adjacent_calendar_year_pairs"][0]["year_a"] == 2020
assert drift["annual_adjacent_calendar_year_pairs"][0]["archive_a"] == "a.zip"
assert drift["annual_adjacent_calendar_year_pairs"][0]["archive_b"] == "b.zip"
assert drift["annual_adjacent_calendar_year_pairs"][0]["edition_scope_a"] == "NOT_RECORDED"
assert len(drift["omitted_nonconsecutive_year_gaps"]) == 1
assert drift["omitted_nonconsecutive_year_gaps"][0]["archive_a"] == "b.zip"
assert drift["omitted_nonconsecutive_year_gaps"][0]["archive_b"] == "c.zip"
assert drift["ambiguous_year_source_collisions"] == []
files[1]["groups"]["PRE_CHATGPT_2020_2022_11_29|2021|P1"]["topic_features"].append(
    {"topic":"topic-B", "documents":2, "text_units":2,
     "edf":{c:0 for c in m.EDF}, "markers":{c:{x:0 for x in ms} for c,ms in m.EDF.items()}}
)
topic_drift = m.topic_drift_tables(files)
assert len(topic_drift["annual_adjacent_topic_pairs"]) == 1
assert topic_drift["annual_adjacent_topic_pairs"][0]["topic"] == "topic-A"
assert topic_drift["annual_adjacent_topic_pairs"][0]["archive_a"] == "a.zip"
assert topic_drift["annual_adjacent_topic_pairs"][0]["archive_b"] == "b.zip"
assert len(topic_drift["omitted_nonconsecutive_topic_gaps"]) == 1
assert topic_drift["ambiguous_topic_year_source_collisions"] == []
print("PASS P45 NIKL streaming parser, frozen EDF, exact date cut, and feature-only output")


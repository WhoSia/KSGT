#!/usr/bin/env python3
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("adapter", HERE / "okhc_adapter.py")
m = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(m)

expected = {
    1948:"POSTLIB_1945_1959",
    1971:"INDUSTRIAL_1960_1979",
    1994:"LATE20C_1980_1999",
    2005:"EARLY_DIGITAL_2000_2008",
    2014:"NEWS_2009_2018",
    2019:"NEWS_2019",
    2021:"PRE_CHATGPT_2020_2022_11_29",
    2023:"TRANSITION_2022_11_30_2023",
    2025:"POST_2024_MIXED_PROVENANCE",
}
for y,p in expected.items():
    assert m.period_bin(y) == p, (y, m.period_bin(y), p)

pre = m.feature_row({
    "id":"x","year":2021,"text":"하지만 그래서 그리고",
    "corpus":"Korean Newspaper Archive"
}, m.DEFAULT_SOURCE_CONTRACT)
assert pre["provenance"] == "INSTITUTIONAL_EDITORIAL_PRE_CHATGPT"
assert pre["edf"]["CONTRAST"] == 1
assert pre["edf"]["CAUSE_RESULT"] == 1
assert pre["edf"]["EXPANSION"] == 1
assert "text" not in pre and "content" not in pre

post = m.feature_row({
    "id":"y","year":2025,"text":"하지만",
    "corpus":"Korean Newspaper Archive"
}, m.DEFAULT_SOURCE_CONTRACT)
assert post["provenance"] == "UNKNOWN"

unknown = m.feature_row({
    "id":"z","year":1988,"text":"그러나",
    "corpus":"Unmapped Corpus"
}, m.DEFAULT_SOURCE_CONTRACT)
assert unknown["provenance"] == "UNKNOWN"
assert unknown["genre"] == "UNKNOWN"
assert unknown["register"] == "UNKNOWN"

print("PASS g9-p45 adapter contract")

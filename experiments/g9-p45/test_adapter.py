#!/usr/bin/env python3
import importlib.util
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("adapter",HERE/"okhc_adapter.py")
m=importlib.util.module_from_spec(spec); assert spec.loader; spec.loader.exec_module(m)

expected={1948:"POSTLIB_1945_1959",1971:"INDUSTRIAL_1960_1979",1994:"LATE20C_1980_1999",
          2005:"EARLY_DIGITAL_2000_2008",2014:"NEWS_2009_2018",2019:"NEWS_2019",
          2021:"PRE_CHATGPT_2020_2022_11_29",2023:"TRANSITION_2022_11_30_2023",
          2025:"POST_2024_MIXED_PROVENANCE"}
for y,p in expected.items(): assert m.period_bin(y)==p

real_schema={
 "id":"news_archive:fixture","content":{"body":"하지만 그래서 그리고"},
 "year":2021,"language":"Modern Korean","script":"Hangul",
 "source":"National Library of Korea","corpus":"Korean Newspaper Archive",
 "doc_type":"news","copyright_status":"Public Domain",
 "text_analytics":{"text_length":10},"url":"https://example.invalid/x"
}
pre=m.feature_row(real_schema,m.DEFAULT_SOURCE_CONTRACT)
assert pre["provenance"]=="INSTITUTIONAL_EDITORIAL_PRE_CHATGPT"
assert pre["copyright"]=="Public Domain"
assert pre["doc_type"]=="news"
assert pre["source_reported_text_length"]==10
assert pre["representation"]=="RAW"
assert pre["edf"]["CONTRAST"]==1 and pre["edf"]["CAUSE_RESULT"]==1 and pre["edf"]["EXPANSION"]==1
assert "text" not in pre and "content" not in pre

post=m.feature_row({"id":"y","year":2025,"text":"하지만","corpus":"Korean Newspaper Archive"},
                   m.DEFAULT_SOURCE_CONTRACT)
assert post["provenance"]=="UNKNOWN"

unknown=m.feature_row({"id":"z","year":1988,"text":"그러나","corpus":"Unmapped Corpus"},
                      m.DEFAULT_SOURCE_CONTRACT)
assert unknown["provenance"]=="UNKNOWN" and unknown["source_contract_status"]=="UNMAPPED"

normalized={**real_schema,"normalized_text":"그러나 그래서 그리고"}
rows=list(m.feature_rows(normalized,m.DEFAULT_SOURCE_CONTRACT,True))
assert [x["representation"] for x in rows]==["RAW","NORMALIZED_SOURCE_PROVIDED"]
assert rows[1]["markers"]["CONTRAST"]["그러나"]==1
assert rows[0]["markers"]["CONTRAST"]["하지만"]==1
print("PASS g9-p45 real-schema adapter and representation firewall")

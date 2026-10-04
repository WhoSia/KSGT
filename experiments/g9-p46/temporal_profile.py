#!/usr/bin/env python3
"""KSGT G9-P46 temporal rival profile compiler.

Consumes the already-derived G9-P45 diagnostics JSON. It never opens raw NIKL
corpora. Output is a descriptive temporal transport profile, not a scaling law.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

BINS=("1-9","10-49","50-199","200+")


def compile_profile(data:dict)->dict:
    mh=data["multi_horizon"]
    ss=data["support_size_sensitivity_by_horizon"]
    horizons={}
    for h in ("1","2","3"):
        horizons[h]={
            "pair_count":mh[h]["pair_count"],
            "median_coarse_jsd":mh[h]["coarse_jsd"]["median"],
            "median_within_class_marker_jsd":mh[h]["within_class_marker_mean_jsd"]["median"],
            "support_bins":{
                b:{
                    "n":ss[h][b]["n"],
                    "median_coarse_jsd":ss[h][b]["coarse_jsd"]["median"],
                    "median_within_class_marker_jsd":ss[h][b]["mean_within_class_marker_jsd"]["median"],
                } for b in BINS
            }
        }
    dense=[horizons[h]["support_bins"]["200+"] for h in ("1","2","3")]
    dense_coarse=[x["median_coarse_jsd"] for x in dense]
    dense_fine=[x["median_within_class_marker_jsd"] for x in dense]
    return {
        "schema":"ksgt.g9.p46.temporal-profile.v1",
        "raw_source_reopened":False,
        "horizons":horizons,
        "dense_200_plus":{
            "coarse_medians":dense_coarse,
            "within_marker_medians":dense_fine,
            "coarse_nondecreasing":all(a<=b for a,b in zip(dense_coarse,dense_coarse[1:])),
            "within_marker_nondecreasing":all(a<=b for a,b in zip(dense_fine,dense_fine[1:])),
        },
        "authority":"DESCRIPTIVE_PROFILE_ONLY_NO_TEMPORAL_SCALING_LAW",
    }


def main()->None:
    ap=argparse.ArgumentParser()
    ap.add_argument("input",type=Path)
    ap.add_argument("--output",type=Path)
    args=ap.parse_args()
    data=json.loads(args.input.read_text(encoding="utf-8"))
    if data.get("schema")!="ksgt.g9.p45.nikl-cp5-derived-diagnostics.v1":
        raise ValueError("unexpected input schema")
    out=compile_profile(data)
    text=json.dumps(out,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        args.output.write_text(text,encoding="utf-8")
    else:
        print(text,end="")


if __name__=="__main__":
    main()

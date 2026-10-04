#!/usr/bin/env python3
"""Exploratory G9-P46 temporal path geometry on already-derived P45 features.

Post-hoc diagnostic only. Uses sqrt(JS) path efficiency; no raw corpus text.
"""
from __future__ import annotations
import math

def path_efficiency(direct_js:float, step_js:list[float])->float|None:
    direct=math.sqrt(max(0.0,direct_js))
    total=sum(math.sqrt(max(0.0,x)) for x in step_js)
    return None if total<=0 else direct/total

def validate_eta(eta:float|None,tol:float=1e-12)->bool:
    return eta is None or (-tol<=eta<=1.0+tol)

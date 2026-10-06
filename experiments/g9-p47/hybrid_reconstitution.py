#!/usr/bin/env python3
"""KSGT G9-P47 authority-aware hybrid reconstitution operator."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Mapping, FrozenSet

ACTIONS=("OVERT","NULL")
VALID_SUPPORT={"SUPPORTED","UNSUPPORTED","UNKNOWN"}

@dataclass(frozen=True)
class HybridDecision:
    status: str
    admissible: FrozenSet[str]
    ranking_hint: tuple[str,...]
    reason: str

def decide(
    learned_scores: Mapping[str,float],
    support: Mapping[str,str],
    hard_veto: Mapping[str,bool],
    domain_authorized: bool=True,
)->HybridDecision:
    for a in ACTIONS:
        if support.get(a,"UNKNOWN") not in VALID_SUPPORT:
            raise ValueError(f"bad support state for {a}")
    if not domain_authorized:
        return HybridDecision("ABSTAIN",frozenset(),tuple(),"OUT_OF_AUTHORIZED_DOMAIN")
    supported={a for a in ACTIONS if support.get(a,"UNKNOWN")=="SUPPORTED" and not hard_veto.get(a,False)}
    unknown={a for a in ACTIONS if support.get(a,"UNKNOWN")=="UNKNOWN" and not hard_veto.get(a,False)}
    support_before_veto={a for a in ACTIONS if support.get(a,"UNKNOWN")=="SUPPORTED"}
    if support_before_veto and not supported and any(hard_veto.get(a,False) for a in support_before_veto):
        return HybridDecision("REVIEW",frozenset(),tuple(),"AUTHORITY_CONFLICT_ALL_SUPPORTED_VETOED")
    if not supported:
        if unknown:
            return HybridDecision("ABSTAIN",frozenset(),tuple(),"NO_SUPPORTED_ACTION_UNKNOWN_REMAINS")
        return HybridDecision("BLOCK",frozenset(),tuple(),"NO_ADMISSIBLE_SUPPORTED_ACTION")
    # Learned scores rank only the already lawful set.
    ranking=tuple(sorted(supported,key=lambda a:(-float(learned_scores.get(a,0.0)),a)))
    if len(supported)>1:
        return HybridDecision("SET_VALUED",frozenset(supported),ranking,"SUPPORTED_PLURALITY_PRESERVED")
    return HybridDecision("SINGLETON_SUPPORTED",frozenset(supported),ranking,"ONLY_ONE_EXPLICITLY_SUPPORTED_ACTION")


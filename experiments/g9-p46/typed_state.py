#!/usr/bin/env python3
"""G9-P46 R2 minimal typed-state signature and quotient logic.

This is not a Korean semantic parser. It operates only on already-typed states
and tests whether a declared projection permits a quotient.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any, FrozenSet, Mapping, Tuple

UNKNOWN="UNKNOWN"

@dataclass(frozen=True)
class TypedState:
    fields: Tuple[Tuple[str, Any], ...]
    support_state: str
    decision_state: str

    @staticmethod
    def from_mapping(fields: Mapping[str,Any],support_state:str,decision_state:str)->"TypedState":
        return TypedState(tuple(sorted(fields.items())),support_state,decision_state)

    def mapping(self)->dict[str,Any]:
        return dict(self.fields)

def signature(state:TypedState, projection:FrozenSet[str])->tuple:
    m=state.mapping()
    values=tuple((k,m.get(k,UNKNOWN)) for k in sorted(projection))
    return values+(("__support__",state.support_state),("__decision__",state.decision_state))

def quotient_equivalent(a:TypedState,b:TypedState,projection:FrozenSet[str])->bool:
    return signature(a,projection)==signature(b,projection)

def safe_to_auto(state:TypedState)->bool:
    return state.support_state in {"EXACT","VALIDATED","COMPOSED"} and state.decision_state=="AUTO"

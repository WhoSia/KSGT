"""Post-transfer development guard for role-proxy versus coordinated groups."""
import copy

import p62_r4_r5_mechanisms as frozen

VERSION = 'P62-R4-R5-development-v2-union-guard'


def infer(forms,target,identity,frozen_v3=None):
    result = copy.deepcopy(frozen.infer(forms,target,identity,frozen_v3))
    possible = [x for x in result['union_evidence'] if x['possible_under_frozen_v3']]
    if possible and result['m2_particle_role']['selected'] is not None:
        result['m2_particle_role'] = {
            'status':'HOLD_COMPETING_COORDINATED_GROUP',
            'selected':None,'competing':len(possible)}
    result['version'] = VERSION
    result['frozen_v1_choice_changed_only_by_union_guard'] = bool(
        possible and result['m2_particle_role']['status']=='HOLD_COMPETING_COORDINATED_GROUP')
    return result


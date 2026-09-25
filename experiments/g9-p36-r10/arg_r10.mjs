import crypto from 'node:crypto';
export const VERSION='KSGT-ARG-v1';
const H=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function graph(x){return {version:VERSION,event:x.event,roles:[...x.roles].sort((a,b)=>a.role.localeCompare(b.role)),scope:x.scope||{},discourse:x.discourse||{},realization:x.realization||{}}}
export function semanticSignature(g){return H({event:g.event,roles:g.roles.map(r=>({role:r.role,referent:r.referent??null,recovery:r.recovery,frame_status:r.frame_status||'UNKNOWN'})),scope:g.scope});}
export function validate(g){
 const errs=[];
 if(!g.event?.predicate)errs.push('MISSING_PREDICATE');
 for(const r of g.roles||[]){
  if(!r.role)errs.push('MISSING_ROLE');
  if(r.recovery!=='EXPLICIT'&&!r.recovery?.startsWith('ZERO_')&&r.recovery!=='UNSATURATED_UNKNOWN')errs.push('BAD_RECOVERY_TYPE');
  if(r.recovery?.startsWith('ZERO_')&&!r.witness&&r.recovery!=='ZERO_GENERIC_OR_EXOPHORIC')errs.push('ZERO_WITHOUT_WITNESS');
  if(r.particle&&r.role_source==='PARTICLE_ONLY')errs.push('PARTICLE_AS_ROLE_IDENTITY');
 }
 return {pass:errs.length===0,errors:errs};
}
export function equivalent(a,b){
 const va=validate(a),vb=validate(b);if(!va.pass||!vb.pass)return {pass:false,reason:'INVALID_GRAPH'};
 return semanticSignature(a)===semanticSignature(b)?{pass:true,reason:'SEMANTIC_GRAPH_INVARIANT'}:{pass:false,reason:'SEMANTIC_GRAPH_CHANGED'};
}

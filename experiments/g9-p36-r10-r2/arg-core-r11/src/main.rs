use serde::{Deserialize,Serialize};
use serde_json::{Map,Value,json};
use sha2::{Sha256,Digest};
use std::{env,fs::File,io::{BufRead,BufReader,BufWriter,Write}};

#[derive(Debug,Clone,Serialize,Deserialize)]
struct Event {
    predicate:String,
    #[serde(default)] sense:Option<String>,
    instance_id:String
}
#[derive(Debug,Clone,Serialize,Deserialize)]
struct Role {
    slot_instance_id:String,
    syntactic_slot:String,
    #[serde(default)] semantic_role:Option<String>,
    #[serde(default)] referent:Option<String>,
    referent_authority:String,
    #[serde(default)] frame_status:Option<String>,
    recovery:String,
    #[serde(default)] witness:Option<String>,
    #[serde(default)] particle:Option<String>,
    #[serde(default)] role_source:Option<String>
}
#[derive(Debug,Clone,Serialize,Deserialize)]
struct Graph {
    version:String,
    event:Event,
    #[serde(default)] roles:Vec<Role>,
    #[serde(default)] scope:Value,
    #[serde(default)] discourse:Value,
    #[serde(default)] realization:Value
}
#[derive(Debug,Deserialize)]
struct Request {
    id:String,
    op:String,
    left:Graph,
    #[serde(default)] right:Option<Graph>,
    #[serde(default)] expected_pass:Option<bool>
}
fn canonical_json(v:&Value)->Value{
    match v {
        Value::Object(m)=>{
            let mut ks:Vec<_>=m.keys().cloned().collect();ks.sort();
            let mut out=Map::new();for k in ks{out.insert(k.clone(),canonical_json(&m[&k]));}
            Value::Object(out)
        },
        Value::Array(a)=>Value::Array(a.iter().map(canonical_json).collect()),
        _=>v.clone()
    }
}
fn hash(v:&Value)->String{let b=serde_json::to_vec(&canonical_json(v)).unwrap();hex::encode(Sha256::digest(&b))}
fn semantic_type_projection(g:&Graph)->Value{
    let mut roles=g.roles.clone();
    roles.sort_by(|a,b|(&a.syntactic_slot,&a.semantic_role,&a.referent,&a.referent_authority,&a.frame_status)
        .cmp(&(&b.syntactic_slot,&b.semantic_role,&b.referent,&b.referent_authority,&b.frame_status)));
    let rs:Vec<Value>=roles.iter().map(|r|json!({
        "syntactic_slot":r.syntactic_slot,
        "semantic_role":r.semantic_role,
        "referent":r.referent,
        "referent_authority":r.referent_authority,
        "frame_status":r.frame_status.as_deref().unwrap_or("UNKNOWN")
    })).collect();
    json!({"event":{"predicate":g.event.predicate,"sense":g.event.sense},"roles":rs,"scope":g.scope})
}
fn token_anchor_projection(g:&Graph)->Value{
    let mut ids:Vec<_>=g.roles.iter().map(|r|r.slot_instance_id.clone()).collect();ids.sort();
    json!({"event_instance_id":g.event.instance_id,"slot_instance_ids":ids})
}
fn type_signature(g:&Graph)->String{hash(&semantic_type_projection(g))}
fn token_anchor(g:&Graph)->String{hash(&token_anchor_projection(g))}
fn validate(g:&Graph)->Vec<String>{
    let mut e=Vec::new();
    if g.version!="KSGT-ARG-v1.1"{e.push("BAD_VERSION".into());}
    if g.event.predicate.trim().is_empty(){e.push("MISSING_PREDICATE".into());}
    if g.event.instance_id.trim().is_empty(){e.push("MISSING_EVENT_INSTANCE_ID".into());}
    for r in &g.roles{
        if r.slot_instance_id.trim().is_empty(){e.push("MISSING_SLOT_INSTANCE_ID".into());}
        if r.syntactic_slot.trim().is_empty(){e.push("MISSING_SYNTACTIC_SLOT".into());}
        let ra=matches!(r.referent_authority.as_str(),
            "BOUND_ENDOPHORIC"|"BOUND_ENDOPHORIC_SET"|"EXOPHORIC_UNSPECIFIED"|
            "DEICTIC_SPECIAL"|"MIXED_BOUND_AND_SPECIAL"|"UNRESOLVED");
        if !ra{e.push("BAD_REFERENT_AUTHORITY".into());}
        let ok=r.recovery=="EXPLICIT"||r.recovery=="UNSATURATED_UNKNOWN"||
            r.recovery=="ZERO_ANAPHORIC"||r.recovery=="ZERO_DEICTIC"||
            r.recovery=="ZERO_GENERIC_OR_EXOPHORIC";
        if !ok{e.push("BAD_RECOVERY_TYPE".into());}
        if (r.recovery=="ZERO_ANAPHORIC"||r.recovery=="ZERO_DEICTIC")&&r.witness.as_deref().unwrap_or("").is_empty(){e.push("ZERO_WITHOUT_WITNESS".into());}
        if r.particle.is_some()&&r.role_source.as_deref()==Some("PARTICLE_ONLY"){e.push("PARTICLE_AS_ROLE_IDENTITY".into());}
        if r.semantic_role.is_some()&&r.role_source.as_deref()==Some("SYNTACTIC_SLOT_ONLY"){e.push("SYNTACTIC_SLOT_LAUNDERED_AS_SEMANTIC_ROLE".into());}
    }
    e.sort();e.dedup();e
}
fn equivalent(a:&Graph,b:&Graph)->bool{
    validate(a).is_empty()&&validate(b).is_empty()&&
    token_anchor(a)==token_anchor(b)&&type_signature(a)==type_signature(b)
}
fn main(){
    let a:Vec<String>=env::args().collect();
    if a.len()!=4||a[1]!="batch"{eprintln!("usage: ksgt_arg_r11 batch <input.jsonl> <output.jsonl>");std::process::exit(2);}
    let r=BufReader::new(File::open(&a[2]).unwrap());let mut w=BufWriter::new(File::create(&a[3]).unwrap());let mut fail=false;
    for line in r.lines(){
        let line=line.unwrap();if line.trim().is_empty(){continue}
        let q:Request=serde_json::from_str(&line).unwrap();let le=validate(&q.left);
        let out=match q.op.as_str(){
            "validate"=>json!({"id":q.id,"op":"validate","pass":le.is_empty(),"errors":le,
                "type_signature":type_signature(&q.left),"token_anchor":token_anchor(&q.left)}),
            "equivalent"=>{
                let rr=q.right.as_ref().expect("right required");let re=validate(rr);
                json!({"id":q.id,"op":"equivalent","pass":equivalent(&q.left,rr),"left_errors":le,"right_errors":re,
                    "left_type_signature":type_signature(&q.left),"right_type_signature":type_signature(rr),
                    "left_token_anchor":token_anchor(&q.left),"right_token_anchor":token_anchor(rr)})
            },
            _=>panic!("bad op")
        };
        let actual=out["pass"].as_bool().unwrap_or(false);let matched=q.expected_pass.map(|x|x==actual).unwrap_or(actual);
        let mut out=out;out["expected_pass"]=q.expected_pass.map(Value::Bool).unwrap_or(Value::Null);out["match_expected"]=Value::Bool(matched);
        if !matched{fail=true;}writeln!(w,"{}",serde_json::to_string(&out).unwrap()).unwrap();
    }
    if fail{std::process::exit(3);}
}

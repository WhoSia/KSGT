use serde::{Deserialize,Serialize};
use serde_json::{Map,Value,json};
use sha2::{Sha256,Digest};
use std::{env,fs::File,io::{BufRead,BufReader,BufWriter,Write}};

#[derive(Debug,Clone,Serialize,Deserialize)]
struct Event {
    predicate:String,
    #[serde(default)] sense:Option<String>
}
#[derive(Debug,Clone,Serialize,Deserialize)]
struct Role {
    syntactic_slot:String,
    #[serde(default)] semantic_role:Option<String>,
    #[serde(default)] referent:Option<String>,
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
    #[serde(default)] right:Option<Graph>
}

fn canonical_json(v:&Value)->Value{
    match v {
        Value::Object(m)=>{
            let mut ks:Vec<_>=m.keys().cloned().collect();
            ks.sort();
            let mut out=Map::new();
            for k in ks { out.insert(k.clone(),canonical_json(&m[&k])); }
            Value::Object(out)
        },
        Value::Array(a)=>Value::Array(a.iter().map(canonical_json).collect()),
        _=>v.clone()
    }
}
fn semantic_projection(g:&Graph)->Value{
    let mut roles=g.roles.clone();
    roles.sort_by(|a,b|{
        (&a.syntactic_slot,&a.semantic_role,&a.referent,&a.frame_status)
            .cmp(&(&b.syntactic_slot,&b.semantic_role,&b.referent,&b.frame_status))
    });
    let rs:Vec<Value>=roles.iter().map(|r|json!({
        "syntactic_slot":r.syntactic_slot,
        "semantic_role":r.semantic_role,
        "referent":r.referent,
        "frame_status":r.frame_status.as_deref().unwrap_or("UNKNOWN")
    })).collect();
    canonical_json(&json!({
        "event":{"predicate":g.event.predicate,"sense":g.event.sense},
        "roles":rs,
        "scope":g.scope
    }))
}
fn signature(g:&Graph)->String{
    let b=serde_json::to_vec(&semantic_projection(g)).unwrap();
    hex::encode(Sha256::digest(&b))
}
fn validate(g:&Graph)->Vec<String>{
    let mut e=Vec::new();
    if g.version!="KSGT-ARG-v1"{e.push("BAD_VERSION".into());}
    if g.event.predicate.trim().is_empty(){e.push("MISSING_PREDICATE".into());}
    for r in &g.roles {
        if r.syntactic_slot.trim().is_empty(){e.push("MISSING_SYNTACTIC_SLOT".into());}
        let ok=r.recovery=="EXPLICIT"||r.recovery=="UNSATURATED_UNKNOWN"||
            r.recovery=="ZERO_ANAPHORIC"||r.recovery=="ZERO_DEICTIC"||
            r.recovery=="ZERO_GENERIC_OR_EXOPHORIC";
        if !ok {e.push("BAD_RECOVERY_TYPE".into());}
        if (r.recovery=="ZERO_ANAPHORIC"||r.recovery=="ZERO_DEICTIC") && r.witness.as_deref().unwrap_or("").is_empty(){
            e.push("ZERO_WITHOUT_WITNESS".into());
        }
        if r.particle.is_some() && r.role_source.as_deref()==Some("PARTICLE_ONLY"){
            e.push("PARTICLE_AS_ROLE_IDENTITY".into());
        }
        if r.semantic_role.is_some() && r.role_source.as_deref()==Some("SYNTACTIC_SLOT_ONLY"){
            e.push("SYNTACTIC_SLOT_LAUNDERED_AS_SEMANTIC_ROLE".into());
        }
    }
    e.sort();e.dedup();e
}
fn main(){
    let a:Vec<String>=env::args().collect();
    if a.len()!=4 || a[1]!="batch" {
        eprintln!("usage: ksgt_arg_r10 batch <input.jsonl> <output.jsonl>");
        std::process::exit(2);
    }
    let r=BufReader::new(File::open(&a[2]).unwrap());
    let mut w=BufWriter::new(File::create(&a[3]).unwrap());
    let mut fail=false;
    for line in r.lines(){
        let line=line.unwrap(); if line.trim().is_empty(){continue}
        let q:Request=serde_json::from_str(&line).unwrap();
        let le=validate(&q.left);
        let out=match q.op.as_str(){
            "validate"=>json!({"id":q.id,"op":"validate","pass":le.is_empty(),"errors":le,"signature":signature(&q.left)}),
            "equivalent"=>{
                let rr=q.right.as_ref().expect("right required");
                let re=validate(rr);
                let pass=le.is_empty()&&re.is_empty()&&signature(&q.left)==signature(rr);
                json!({"id":q.id,"op":"equivalent","pass":pass,"left_errors":le,"right_errors":re,
                    "left_signature":signature(&q.left),"right_signature":signature(rr)})
            },
            _=>panic!("bad op")
        };
        if !out["pass"].as_bool().unwrap_or(false){ fail=true; }
        writeln!(w,"{}",serde_json::to_string(&out).unwrap()).unwrap();
    }
    if fail {std::process::exit(3);}
}

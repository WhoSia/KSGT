use serde::{Deserialize,Serialize};
use std::{collections::{BTreeMap,BTreeSet},env,fs};

#[derive(Debug,Clone,Serialize,Deserialize)]
struct Interval { lo:f64, hi:f64 }

#[derive(Debug,Clone,Serialize,Deserialize)]
struct Action {
    name:String,
    feasible:bool,
    objectives:BTreeMap<String,Interval>
}

#[derive(Debug,Clone,Serialize,Deserialize)]
struct CourtInput { actions:Vec<Action> }

#[derive(Debug,Clone,Serialize)]
struct PairVerdict {
    a:String,
    b:String,
    a_robustly_dominates_b:bool,
    b_robustly_dominates_a:bool
}

#[derive(Debug,Clone,Serialize)]
struct CourtOutput {
    feasible_actions:Vec<String>,
    robust_frontier:Vec<String>,
    pairwise:Vec<PairVerdict>,
    scalarization_used:bool
}

fn validate(a:&Action)->Result<(),String>{
    for (k,v) in &a.objectives {
        if !v.lo.is_finite() || !v.hi.is_finite() { return Err(format!("nonfinite:{k}")); }
        if v.lo>v.hi { return Err(format!("bad_interval:{k}")); }
    }
    Ok(())
}

fn dominates(a:&Action,b:&Action)->bool{
    if !a.feasible || !b.feasible { return false; }
    let ka:BTreeSet<_>=a.objectives.keys().cloned().collect();
    let kb:BTreeSet<_>=b.objectives.keys().cloned().collect();
    if ka!=kb || ka.is_empty() { return false; }
    let mut strict=false;
    for k in ka {
        let x=&a.objectives[&k];
        let y=&b.objectives[&k];
        if x.lo<y.hi { return false; }
        if x.lo>y.hi { strict=true; }
    }
    strict
}

fn judge(inp:CourtInput)->Result<CourtOutput,String>{
    if inp.actions.is_empty(){return Err("no_actions".into());}
    for a in &inp.actions { validate(a)?; }
    let feasible:Vec<_>=inp.actions.iter().filter(|x|x.feasible).collect();
    if feasible.is_empty(){return Err("no_feasible_actions".into());}
    let mut pairwise=Vec::new();
    let mut dominated:BTreeSet<String>=BTreeSet::new();
    for i in 0..feasible.len(){
        for j in i+1..feasible.len(){
            let a=feasible[i]; let b=feasible[j];
            let ab=dominates(a,b); let ba=dominates(b,a);
            if ab { dominated.insert(b.name.clone()); }
            if ba { dominated.insert(a.name.clone()); }
            pairwise.push(PairVerdict{
                a:a.name.clone(),b:b.name.clone(),
                a_robustly_dominates_b:ab,b_robustly_dominates_a:ba
            });
        }
    }
    let frontier=feasible.iter().filter(|x|!dominated.contains(&x.name)).map(|x|x.name.clone()).collect();
    Ok(CourtOutput{
        feasible_actions:feasible.iter().map(|x|x.name.clone()).collect(),
        robust_frontier:frontier,
        pairwise,
        scalarization_used:false
    })
}

fn main(){
    let a:Vec<String>=env::args().collect();
    if a.len()!=3 { eprintln!("usage: ksgt_realize_v02 <input.json> <output.json>"); std::process::exit(2); }
    let text=fs::read_to_string(&a[1]).unwrap();
    let inp:CourtInput=serde_json::from_str(&text).unwrap();
    match judge(inp){
        Ok(out)=>fs::write(&a[2],serde_json::to_string_pretty(&out).unwrap()+"\n").unwrap(),
        Err(e)=>{eprintln!("{e}");std::process::exit(3);}
    }
}

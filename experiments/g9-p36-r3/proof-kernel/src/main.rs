use std::{env,fs,collections::HashSet};

fn get_str<'a>(v:&'a serde_json::Value,k:&str)->&'a str{v.get(k).and_then(|x|x.as_str()).unwrap_or("")}
fn arr(v:&serde_json::Value,k:&str)->Vec<String>{
 match v.get(k).and_then(|x|x.as_array()){
  Some(xs)=>xs.iter().filter_map(|x|x.as_str().map(|s|s.to_string())).collect(),
  None=>Vec::new()
 }
}
fn set(xs:&[String])->HashSet<String>{xs.iter().cloned().collect()}
fn main(){
 let a:Vec<String>=env::args().collect(); if a.len()!=3{panic!("usage: proof_kernel <candidates.jsonl> <proofs.jsonl>");}
 let input=fs::read_to_string(&a[1]).unwrap(); let mut out=String::new();
 let mut total=0usize; let mut cert=0usize; let mut reasons=std::collections::BTreeMap::<String,usize>::new();
 for line in input.lines().filter(|x|!x.trim().is_empty()){
  total+=1; let v:serde_json::Value=serde_json::from_str(line).unwrap();
  let src=v["source_obligation_atoms"].as_array().unwrap();
  let aa:Vec<String>=src[0].as_array().unwrap().iter().filter_map(|x|x.as_str().map(String::from)).collect();
  let bb:Vec<String>=src[1].as_array().unwrap().iter().filter_map(|x|x.as_str().map(String::from)).collect();
  let fused=arr(&v,"fused_obligation_atoms"); let sa=set(&aa); let sb=set(&bb); let sf=set(&fused);
  let union:HashSet<String>=sa.union(&sb).cloned().collect();
  let grounding=v["grounding"]["compatible"].as_bool().unwrap_or(false);
  let force=v["force_compatible"].as_bool().unwrap_or(false);
  let repr=v["representation_sufficiency"]["pass"].as_bool().unwrap_or(false);
  let gain=v["compression"]["gain_chars"].as_i64().unwrap_or(i64::MIN)>0;
  let no_addition=sf==union;
  let backward=sa.is_subset(&sf)&&sb.is_subset(&sf);
  let forward=sf.is_subset(&union);
  let op=get_str(&v,"operation");
  let op_ok=if op=="S1_SUBSUMPTION" {(sa.is_subset(&sb)&&sa!=sb)||(sb.is_subset(&sa)&&sa!=sb)}
            else if op=="F1_CONJUNCTIVE_FUSION" {!(sa.is_subset(&sb)||sb.is_subset(&sa)) && !sa.intersection(&sb).collect::<Vec<_>>().is_empty()}
            else {false};
  let (verdict,reason)=if !repr {("ABSTAIN","REPRESENTATION_SUFFICIENCY_VETO")}
   else if !grounding {("ABSTAIN","GROUNDING_MISMATCH")}
   else if !force {("ABSTAIN","FORCE_VALUE_ACTION_MISMATCH")}
   else if !op_ok {("ABSTAIN","OPERATION_PROOF_FAILED")}
   else if !forward||!backward||!no_addition {("ABSTAIN","BIDIRECTIONAL_PROOF_FAILED")}
   else if !gain {("ABSTAIN","NO_POSITIVE_COMPRESSION_GAIN")}
   else {cert+=1;("CERTIFY","PROOF_COMPLETE")};
  *reasons.entry(reason.to_string()).or_insert(0)+=1;
  let p=serde_json::json!({
    "id":v["id"],"paper":v["paper"],"file":v["file"],"operation":op,
    "source_ids":v["source_ids"],"source_texts":v["source_texts"],
    "source_obligation_atoms":v["source_obligation_atoms"],"shared_atoms":v["shared_atoms"],
    "left_unique_atoms":v["left_unique_atoms"],"right_unique_atoms":v["right_unique_atoms"],
    "fused_obligation_atoms":v["fused_obligation_atoms"],
    "grounding_witness":{"pass":grounding},
    "representation_sufficiency_witness":v["representation_sufficiency"],
    "forward_entailment_witness":{"pass":forward,"basis":"typed-union exact containment"},
    "backward_entailment_witness":{"pass":backward,"basis":"each source typed atom set contained in fusion"},
    "no_addition_witness":{"pass":no_addition},
    "no_loss_witness":{"pass":backward},
    "force_value_action_witness":{"pass":force},
    "compression_gain":v["compression"],
    "verdict":verdict,"reason":reason
  });
  out.push_str(&serde_json::to_string(&p).unwrap()); out.push('\n');
 }
 fs::write(&a[2],out).unwrap();
 eprintln!("{}",serde_json::json!({"total":total,"certifiable":cert,"reason_counts":reasons}));
}

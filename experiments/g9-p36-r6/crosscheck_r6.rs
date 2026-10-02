use std::{collections::{HashMap,HashSet},env,fs};

fn pair(a:&str,b:&str)->String{if a<b{format!("{}\n{}",a,b)}else{format!("{}\n{}",b,a)}}
fn main(){
 let args:Vec<String>=env::args().collect();if args.len()<2{panic!("usage: crosscheck_r6 <factor_postings.tsv>");}
 let s=fs::read_to_string(&args[1]).unwrap();
 let mut by_item:HashMap<String,(String,String,HashSet<String>)>=HashMap::new();
 let mut reuse_post:HashMap<String,Vec<String>>=HashMap::new();
 let mut ground_post:HashMap<String,Vec<String>>=HashMap::new();
 for line in s.lines(){
  if line.trim().is_empty(){continue} let p:Vec<&str>=line.split('\t').collect();if p.len()!=4{panic!("bad tsv");}
  let id=p[0].to_string();let core=p[1].to_string();let ground=p[2].to_string();let factor=p[3].to_string();
  by_item.entry(id.clone()).or_insert((core.clone(),ground.clone(),HashSet::new())).2.insert(factor.clone());
  reuse_post.entry(format!("{}|{}",core,factor)).or_default().push(id.clone());
  ground_post.entry(format!("{}|{}|{}",core,ground,factor)).or_default().push(id);
 }
 let mut reuse_pairs:HashSet<String>=HashSet::new();
 for xs in reuse_post.values(){let u:HashSet<_>=xs.iter().collect();let v:Vec<_>=u.into_iter().collect();for i in 0..v.len(){for j in i+1..v.len(){reuse_pairs.insert(pair(v[i],v[j]));}}}
 let mut grounded_shared:HashSet<String>=HashSet::new();
 for xs in ground_post.values(){let u:HashSet<_>=xs.iter().collect();let v:Vec<_>=u.into_iter().collect();for i in 0..v.len(){for j in i+1..v.len(){grounded_shared.insert(pair(v[i],v[j]));}}}
 let mut micro=0usize;
 for k in grounded_shared{
  let mut sp=k.split('\n');let a=sp.next().unwrap();let b=sp.next().unwrap();
  let aa=&by_item.get(a).unwrap().2;let bb=&by_item.get(b).unwrap().2;
  let shared=aa.intersection(bb).count();let lu=aa.difference(bb).count();let ru=bb.difference(aa).count();
  if shared>0&&lu>0&&ru>0{micro+=1;}
 }
 println!("reuse_pairs\t{}",reuse_pairs.len());
 println!("micro_candidates\t{}",micro);
}

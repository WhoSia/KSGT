use std::{collections::{HashMap,HashSet},env,fs};
#[derive(Clone)] struct Item{paper:String,exact:String,family_core:String,family:String,text_hash:String,edges:HashSet<String>,content:HashSet<String>}
fn pair(a:&str,b:&str)->String{if a<b{format!("{}\n{}",a,b)}else{format!("{}\n{}",b,a)}}
fn chain(es:&HashSet<String>)->bool{let mut next:HashMap<&str,HashSet<&str>>=HashMap::new();for e in es{let mut p=e.splitn(2,'>');let a=p.next().unwrap_or("");let b=p.next().unwrap_or("");next.entry(a).or_default().insert(b);}for e in es{let mut p=e.splitn(2,'>');let _=p.next();let b=p.next().unwrap_or("");if next.get(b).map(|x|!x.is_empty()).unwrap_or(false){return true}}false}
fn count(items:&HashMap<String,Item>, family_arm:bool)->(usize,HashSet<String>,HashSet<String>){
 let mut post:HashMap<String,Vec<String>>=HashMap::new();
 for (id,x) in items{let core=if family_arm{&x.family_core}else{&x.exact};for e in &x.edges{post.entry(format!("{}|{}",core,e)).or_default().push(id.clone());}}
 let mut pairs:HashMap<String,(String,String,HashSet<String>)>=HashMap::new();
 for (k,xs) in post{let edge=k.split_once('|').map(|x|x.1).unwrap_or("").to_string();let u:Vec<String>=xs.into_iter().collect::<HashSet<_>>().into_iter().collect();for i in 0..u.len(){for j in i+1..u.len(){let pk=pair(&u[i],&u[j]);pairs.entry(pk).or_insert((u[i].clone(),u[j].clone(),HashSet::new())).2.insert(edge.clone());}}}
 let mut n=0;let mut papers=HashSet::new();let mut fams=HashSet::new();
 for (_, (a,b,shared)) in pairs{let A=&items[&a];let B=&items[&b];if A.paper==B.paper||A.text_hash==B.text_hash||shared.len()<2||!chain(&shared){continue}let lu=A.content.difference(&B.content).next().is_some();let ru=B.content.difference(&A.content).next().is_some();if !lu||!ru{continue}n+=1;papers.insert(A.paper.clone());papers.insert(B.paper.clone());if family_arm{fams.insert(A.family.clone());}}
 (n,papers,fams)
}
fn main(){let a:Vec<String>=env::args().collect();if a.len()<2{panic!("usage");}let s=fs::read_to_string(&a[1]).unwrap();let mut items=HashMap::new();for line in s.lines(){if line.trim().is_empty(){continue}let p:Vec<&str>=line.split('\t').collect();if p.len()!=8{panic!("bad tsv {}",p.len())}items.insert(p[0].to_string(),Item{paper:p[1].to_string(),exact:p[2].to_string(),family_core:p[3].to_string(),family:p[4].to_string(),text_hash:p[5].to_string(),edges:p[6].split(';').filter(|x|!x.is_empty()).map(str::to_string).collect(),content:p[7].split(';').filter(|x|!x.is_empty()).map(str::to_string).collect()});}
 let (e,_,_)=count(&items,false);let (f,p,fa)=count(&items,true);println!("exact_primary\t{}",e);println!("family_primary\t{}",f);println!("family_distinct_papers\t{}",p.len());println!("family_distinct_families\t{}",fa.len());}

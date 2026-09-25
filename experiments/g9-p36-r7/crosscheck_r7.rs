use std::{collections::{HashMap,HashSet},env,fs};

#[derive(Clone)]
struct Item{paper:String,core:String,text_hash:String,edges:HashSet<String>,content:HashSet<String>}
fn pair(a:&str,b:&str)->String{if a<b{format!("{}\n{}",a,b)}else{format!("{}\n{}",b,a)}}
fn chain(shared:&HashSet<String>)->bool{
 let mut starts:HashMap<String,HashSet<String>>=HashMap::new();
 for e in shared{let p:Vec<&str>=e.splitn(2,'>').collect();if p.len()==2{starts.entry(p[0].to_string()).or_default().insert(p[1].to_string());}}
 for e in shared{let p:Vec<&str>=e.splitn(2,'>').collect();if p.len()==2&&starts.get(p[1]).map(|s|!s.is_empty()).unwrap_or(false){return true;}}
 false
}
fn main(){
 let a:Vec<String>=env::args().collect();if a.len()<2{panic!("usage: crosscheck_r7 <motif_items.tsv>");}
 let s=fs::read_to_string(&a[1]).unwrap();let mut items:HashMap<String,Item>=HashMap::new();let mut post:HashMap<String,Vec<String>>=HashMap::new();
 for line in s.lines(){if line.trim().is_empty(){continue}let p:Vec<&str>=line.split('\t').collect();if p.len()!=6{panic!("bad row {}",line);}
  let id=p[0].to_string();let edges:HashSet<String>=if p[4].is_empty(){HashSet::new()}else{p[4].split(';').map(|x|x.to_string()).collect()};
  let content:HashSet<String>=if p[5].is_empty(){HashSet::new()}else{p[5].split(';').map(|x|x.to_string()).collect()};
  let it=Item{paper:p[1].to_string(),core:p[2].to_string(),text_hash:p[3].to_string(),edges:edges.clone(),content};
  for e in &edges{post.entry(format!("{}|{}",it.core,e)).or_default().push(id.clone());}items.insert(id,it);
 }
 let mut pairs:HashMap<String,(String,String,HashSet<String>)>=HashMap::new();
 for (k,xs) in post{let mut u:Vec<String>=xs.into_iter().collect::<HashSet<_>>().into_iter().collect();u.sort();let edge=k.split_once('|').unwrap().1.to_string();for i in 0..u.len(){for j in i+1..u.len(){let pk=pair(&u[i],&u[j]);let e=pairs.entry(pk).or_insert((u[i].clone(),u[j].clone(),HashSet::new()));e.2.insert(edge.clone());}}}
 let mut exploratory=0usize;let mut chains=0usize;let mut primary=0usize;
 for (_,(ai,bi,shared)) in pairs{let a=&items[&ai];let b=&items[&bi];if a.core!=b.core||a.text_hash==b.text_hash{continue}
  let lu=a.content.iter().any(|x|!b.content.contains(x));let ru=b.content.iter().any(|x|!a.content.contains(x));if !lu||!ru{continue}
  exploratory+=1;let ch=shared.len()>=2&&chain(&shared);if ch{chains+=1;if a.paper!=b.paper{primary+=1;}}
 }
 println!("exploratory_pairs\t{}",exploratory);println!("chain_pairs\t{}",chains);println!("primary_cross_paper_chain_pairs\t{}",primary);
}

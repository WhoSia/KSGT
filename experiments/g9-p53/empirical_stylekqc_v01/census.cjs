'use strict';
// Metadata-only census of a pinned public Korean human paraphrase source.
// Never republishes source sentences; diversity does not imply preference.
const crypto=require('node:crypto'),fs=require('node:fs');
const BLOB='27846d77675f45284873d45658efc31996396bbf';
function gitBlobSha(buf){return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');}
function census(buf,{verify=true}={}){
 if(!Buffer.isBuffer(buf))throw Error('RAW_BUFFER_REQUIRED');
 const actual=gitBlobSha(buf);
 if(verify&&actual!==BLOB)throw Error('PINNED_SOURCE_BLOB_MISMATCH:'+actual);
 const t=buf.toString('utf8').replace(/\r\n/g,'\n');
 if(t.includes('\ufffd'))throw Error('MALFORMED_UNICODE');
 const lines=t.trimEnd().split('\n');
 if(lines.shift()!=='topic\tsentence')throw Error('WRONG_HEADER');
 const records=lines.map((line,i)=>{
  const k=line.indexOf('\t');if(k<1||line.indexOf('\t',k+1)>=0)throw Error('BAD_TSV_ROW_'+i);
  const topic=line.slice(0,k),sentence=line.slice(k+1);
  if(!sentence||!/^[0-5]$/.test(topic))throw Error('BAD_ITEM_'+i);
  return {topic,sentence};
 });
 if(records.length%10!==0)throw Error('NON_MULTIPLE_TEN_RECORDS');
 const distinct=Object.create(null),topics=Object.create(null);
 let repeated=0,crossHalf=0,withinHalf=0,geujung=0,namaji=0;
 for(const r of records){topics[r.topic]=(topics[r.topic]||0)+1;geujung+=(r.sentence.match(/그중/g)||[]).length;namaji+=(r.sentence.match(/나머지/g)||[]).length;}
 for(let i=0;i<records.length;i+=10){
  const g=records.slice(i,i+10);
  if(new Set(g.map(x=>x.topic)).size!==1)throw Error('CROSSED_TOPIC_GROUP_'+i);
  const texts=g.map(x=>x.sentence),n=new Set(texts).size;
  distinct[n]=(distinct[n]||0)+1;if(n<10)repeated++;
  const a=texts.slice(0,5),b=texts.slice(5);
  if(new Set(a).size<5||new Set(b).size<5)withinHalf++;
  if(a.some(s=>b.includes(s)))crossHalf++;
 }
 return {schema:'ksgt.g9p53.stylekqc_topic_test_census.v1',
  authority:'RETROSPECTIVE_DESCRIPTIVE_HUMAN_PARAPHRASES_NOT_WRITER_EDIT_CHOICES',
  source:{repo:'cynthia/stylekqc',path:'topic/test.tsv',commit:'f12bff2c26779969e1f8e54e1b98fcb8cfeeff77',git_blob:actual,raw_bytes:buf.length,repo_declared_license:'CC-BY-SA-4.0; published paper separately CC-BY-NC-4.0'},
  rows:records.length,groups:records.length/10,topic_distribution:topics,unique_forms_per_group:distinct,
  full_ten_distinct_groups:distinct['10']||0,groups_with_duplicates:repeated,
  cross_half_exact_match_groups:crossHalf,within_half_duplicate_groups:withinHalf,
  literal_substring_occurrences:{'그중':geujung,'나머지':namaji},
  limitations:{independent_human_writing_quality:false,partitive_antecedent_gold:false,context_bearing_keep_edit_actions:false,
   prose_genre:'SHORT_DIRECTIVES_ONLY',sentence_bytes_in_receipt:false}};
}
if(require.main===module){
 if(!process.argv[2])throw Error('USAGE: node census.cjs private-test.tsv');
 process.stdout.write(JSON.stringify(census(fs.readFileSync(process.argv[2])),null,2)+'\n');
}
module.exports={census,gitBlobSha,BLOB};

// KSGT G9-P36-R2 source-schema adapter v1.
// This adapter is scientific-input normalization only. It does not inspect
// candidate outcomes or alter C3-R2 semantic/deletion rules.

export const ADAPTER_CONTRACT=Object.freeze({
  version:"R2-RESPONSE-CHUNK-ADAPTER-v1",
  existing_chunks:"PRESERVE_EXACTLY",
  absent_chunks:"RECONSTRUCT_FROM_AUTHOR_RESPONSE_MARKDOWN",
  quote_rule:"maximal consecutive lines beginning with >",
  reply_rule:"text after quote block until next quote block",
  no_quote_rule:"single WHOLE_RESPONSE chunk with synthetic review root",
  pre_quote_preamble:"ignored unless no quote blocks",
  unresolved:"ABSTAIN"
});

function stripQuote(line){ return line.replace(/^\s*>\s?/,""); }

export function ensureResponseChunks(doc){
  if(Array.isArray(doc.response_chunk_nodes_by_quote) && doc.response_chunk_nodes_by_quote.length){
    return {...doc,_r2_adapter:{mode:"EXISTING",version:ADAPTER_CONTRACT.version}};
  }
  const chunks=[];
  let seq=0;
  const ars=Array.isArray(doc.author_response)?doc.author_response:[];
  for(let ai=0; ai<ars.length; ai++){
    const ar=ars[ai]||{}, text=String(ar.comment||"").replace(/\r/g,"");
    if(!text.trim()) continue;
    const lines=text.split("\n");
    const qblocks=[];
    for(let i=0;i<lines.length;){
      if(!/^\s*>/.test(lines[i])){ i++; continue; }
      const qs=[],start=i;
      while(i<lines.length && /^\s*>/.test(lines[i])){ qs.push(stripQuote(lines[i])); i++; }
      const replyStart=i, rs=[];
      while(i<lines.length && !/^\s*>/.test(lines[i])){ rs.push(lines[i]); i++; }
      const quoted=qs.join("\n").trim(), reply=rs.join("\n").trim();
      if(quoted && reply) qblocks.push({quoted_review:quoted,author_reply:reply,start,replyStart});
    }
    if(qblocks.length){
      for(let qi=0;qi<qblocks.length;qi++){
        const b=qblocks[qi], raw=ar._raw_response_id||("author_response_"+ai);
        chunks.push({
          ix:`${doc.doc_name}_${doc.review_id}_${raw}_ADAPTER_RQ-${seq++}`,
          content:b.quoted_review+"\n\n"+b.author_reply,
          ntype:"response_chunk",
          src_ix:raw,
          start:null,end:null,label:{},
          quoted_review:b.quoted_review,
          author_reply:b.author_reply
        });
      }
    } else {
      const raw=ar._raw_response_id||("author_response_"+ai);
      chunks.push({
        ix:`${doc.doc_name}_${doc.review_id}_${raw}_ADAPTER_WHOLE-${seq++}`,
        content:text,
        ntype:"response_chunk",
        src_ix:raw,
        start:null,end:null,label:{},
        quoted_review:"__WHOLE_REVIEW__",
        author_reply:text
      });
    }
  }
  return {...doc,response_chunk_nodes_by_quote:chunks,
    _r2_adapter:{mode:"RECONSTRUCTED",version:ADAPTER_CONTRACT.version,chunks:chunks.length}};
}

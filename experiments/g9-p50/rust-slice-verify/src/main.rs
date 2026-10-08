use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{env, fs::{self, File}, io::{self, Read}, path::{Path, PathBuf}};

fn get<'a>(root: &'a Value, path: &[&str]) -> Result<&'a Value, String> {
    let mut cur = root;
    for key in path { cur = cur.get(*key).ok_or_else(|| format!("missing field {}", path.join(".")))?; }
    Ok(cur)
}
fn text(root: &Value, path: &[&str]) -> Result<String, String> {
    get(root, path)?.as_str().map(str::to_owned).ok_or_else(|| format!("not text: {}", path.join(".")))
}
fn number(root: &Value, path: &[&str]) -> Result<u64, String> {
    get(root, path)?.as_u64().ok_or_else(|| format!("not nonnegative integer: {}", path.join(".")))
}
fn digest(path: &Path) -> io::Result<String> {
    let mut reader = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 1024 * 1024];
    loop {
        let n = reader.read(&mut buf)?;
        if n == 0 { break; }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}
fn verify(dir: &Path) -> Result<(), String> {
    let m: Value = serde_json::from_slice(&fs::read(dir.join("manifest.json")).map_err(|e|e.to_string())?)
        .map_err(|e| format!("invalid JSON manifest: {e}"))?;
    if text(&m, &["schema"])? != "ksgt.g9.p50.model-training-slice-receipt.v1" {return Err("unexpected schema".into());}
    if text(&m, &["status"])? != "MODEL_TRAINING_SLICE_MATERIALIZED" {return Err("unexpected status".into());}
    if text(&m, &["source","dataset"])? != "HuggingFaceFW/fineweb-2" {return Err("unexpected dataset".into());}
    if text(&m, &["source","config"])? != "kor_Hang" {return Err("unexpected config".into());}
    if text(&m, &["source","revision"])? != "fb08250" {return Err("unsealed revision".into());}
    if number(&m, &["tokenizer","piece_size"])? != 32768 {return Err("wrong vocab size".into());}
    if text(&m, &["tokenizer","model_sha256"])? != "d99338c8e4e112fd2f9eef11e7a4a2b25435a452253bc7e5e653e74eca59b2c1" {return Err("wrong tokenizer model".into());}
    if number(&m, &["tokenizer_only_reconstruction","documents"])? != 60326 ||
       number(&m, &["tokenizer_only_reconstruction","characters"])? != 100002865 ||
       text(&m, &["tokenizer_only_reconstruction","ordered_record_aggregate_sha256"])? != "2e2fde1a21e01740db3322d078b6d2c05f26b0f5ef864614bcfc2a59a6aa70f3" {
        return Err("canonical tokenizer sample reconstruction mismatch".into());
    }
    if get(&m, &["raw_text_in_artifact"])?.as_bool() != Some(false) {return Err("raw text policy violated".into());}
    if get(&m, &["model_training_authorized_by_receipt"])?.as_bool() != Some(false) {return Err("unexpected authorization".into());}
    if number(&m, &["protected_pia","source_hashes"])? != 24 ||
       number(&m, &["protected_pia","phrase_fingerprints"])? != 55 {return Err("protected registry mismatch".into());}
    for (lane, expected, filename) in [("train",100_000_000u64,"train.u16le"),("dev",2_000_000u64,"dev.u16le")] {
        let tokens = number(&m,&[lane,"tokens"])?;
        if tokens != expected {return Err(format!("{lane} token count mismatch"));}
        let bytes = tokens.checked_mul(2).ok_or("token byte overflow")?;
        let p = dir.join(filename);
        if fs::metadata(&p).map_err(|e|e.to_string())?.len() != bytes {return Err(format!("{lane} byte count mismatch"));}
        if number(&m,&[lane,"uint16_bytes"])? != bytes {return Err(format!("{lane} manifest byte count mismatch"));}
        if digest(&p).map_err(|e|e.to_string())? != text(&m,&[lane,"token_binary_sha256"])? {return Err(format!("{lane} SHA mismatch"));}
    }
    for pair in ["tokenizer_train","tokenizer_dev","train_dev"] {
        if number(&m,&["pairwise_record_overlap",pair])? != 0 {return Err(format!("declared {pair} overlap is nonzero"));}
    }
    // No independently reconstructable record-id lists are included in the artifact.
    // The overlap check above validates declared consistency, not actual set disjointness.
    println!("PASS: token stream bytes, lengths, provenance fields, tokenizer identity");
    println!("AUTHORITY LIMIT: pairwise record disjointness is generator-attested, not independently verified");
    println!("MODEL_TRAINING_AUTHORIZED: false");
    Ok(())
}
fn main() {
    let args: Vec<_> = env::args().collect();
    if args.len()!=2 { eprintln!("Usage: ksgt-p50-slice-verify <artifact-directory>"); std::process::exit(2); }
    let dir=PathBuf::from(&args[1]);
    if let Err(e)=verify(&dir) {eprintln!("FAIL: {e}"); std::process::exit(1);}
}

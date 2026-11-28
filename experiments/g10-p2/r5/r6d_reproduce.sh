#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
tsc --strict --target ES2022 --module commonjs --outDir "$out" r6d_realizer.ts r6d_cases.ts
node "$out/r6d_cases.js"
if [[ $# -eq 1 ]]; then python r6d_corpus_sample.py "$1"; fi

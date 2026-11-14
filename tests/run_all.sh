#!/usr/bin/env bash
# Feature regression tests (headless Chromium). Run after scripts/build_index.py.
# Any failing test makes this exit non-zero. Usage: bash tests/run_all.sh
set -u
cd "$(dirname "$0")/.."
fail=0
for t in qdsim t8 t9 t10 t11n t12 a11y; do
  echo "== $t"
  out=$(python3 "tests/$t.py" 2>&1); rc=$?
  echo "$out" | grep -E "^FAIL|passed|^[0-9]+/[0-9]+|days|a11y:|Error|SKIP" | tail -5
  if [ $rc -ne 0 ] || echo "$out" | grep -qE "^FAIL|Error"; then fail=1; echo "!! $t failed"; fi
done
[ $fail -eq 0 ] && echo "ALL TESTS PASS" || { echo "SOME TESTS FAILED"; exit 1; }

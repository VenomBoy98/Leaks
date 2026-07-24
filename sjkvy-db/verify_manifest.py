#!/usr/bin/env python3
"""Byte-exact integrity check of transferred sjkvy-db artifacts against MANIFEST.sha256."""
import hashlib, sys, os
ok = bad = missing = 0
for line in open('MANIFEST.sha256'):
    h, path = line.strip().split('  ', 1)
    if not os.path.exists(path):
        print('MISSING', path); missing += 1; continue
    d = hashlib.sha256(open(path, 'rb').read()).hexdigest()
    if d == h: ok += 1
    else: print('MISMATCH', path); bad += 1
print(f'OK={ok} MISMATCH={bad} MISSING={missing}')
sys.exit(0 if bad == missing == 0 else 1)

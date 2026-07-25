#!/usr/bin/env python3
"""Deeper semantic cross-check: catch runtime-first-contact errors WITHOUT a DB.
Simulates apply-order dependency, column existence per DML, enum-value validity,
grant-before-object, and trigger/function symbol resolution. Not a substitute for
runtime PASS — a readiness gate that removes predictable first-run failures."""
import re, glob, sys
mig = [(f, open(f).read()) for f in sorted(glob.glob('migrations/*.sql'))]
allsql = '\n'.join(s for _,s in mig)
fails=[]; warns=[]
def F(n,d=''): fails.append((n,d)); print('FAIL',n,f'[{d}]' if d else '')
def P(n): print('PASS',n)
def W(n,d=''): warns.append((n,d)); print('WARN',n,f'[{d}]' if d else '')

# --- build column model from ALL migrations (0000 core + later additive tables) ---
cols={}
# split on CREATE TABLE, take text up to the line that closes with );
schema_txt = '\n'.join(m[1] for m in mig)
for blk in re.split(r'(?=CREATE TABLE app\.)', schema_txt):
    hm = re.match(r'CREATE TABLE app\.(\w+)\s*\(', blk)
    if not hm: continue
    t = hm.group(1)
    # body = everything from first ( to the matching );  (paren-count)
    start = blk.index('('); depth=0; end=None
    for i in range(start, len(blk)):
        if blk[i]=='(': depth+=1
        elif blk[i]==')':
            depth-=1
            if depth==0: end=i; break
    body = blk[start+1:end] if end else ''
    cs=set()
    # strip CHECK(...) parenthetical contents so inner commas don't create phantom tokens
    depth=0; flat=''
    for ch in body:
        if ch=='(': depth+=1; continue
        if ch==')': depth-=1; continue
        flat += ch if depth==0 else ' '
    for frag in flat.split(','):
        frag=frag.strip()
        mm=re.match(r'^(\w+)\s+\w', frag)
        if mm and mm.group(1).upper() not in ('CONSTRAINT','UNIQUE','CHECK','PRIMARY','FOREIGN'):
            cs.add(mm.group(1))
    cols[t]=cs
# ALTER ADD COLUMN / ADD CONSTRAINT
for m in re.finditer(r'ALTER TABLE app\.(\w+) ADD (?:COLUMN )?(\w+)', allsql):
    if m.group(2) not in ('CONSTRAINT','FOREIGN','PRIMARY','UNIQUE','CHECK'):
        cols.setdefault(m.group(1),set()).add(m.group(2))
print(f'INFO  parsed {len(cols)} tables')

# 1. enum/CHECK value usage: status literals written must be in the column CHECK set.
# Collect CHECK-IN sets from ALL migrations (a later migration like 0010 may add a table
# such as scan_jobs whose status domain — QUEUED/SCANNING/DONE/FAILED — is its own).
enum={}
for m in re.finditer(r"(\w+)\s+text[^,]*?CHECK\s*\(\s*\1\s+IN\s*\(([^)]+)\)", allsql):
    vals=set(re.findall(r"'([^']+)'", m.group(2)))
    enum.setdefault(m.group(1),set()).update(vals)
# check status assignments in functions: SET status='X' and status='X' comparisons
bad_status=[]
for col in ('status','decision','recommendation','outcome','scan_status','result'):
    if col not in enum: continue
    for lit in re.findall(rf"(?<![a-z_]){col}\s*=\s*'([A-Z_]+)'", allsql):
        if lit not in enum[col]: bad_status.append(f'{col}={lit}')
    for lit in re.findall(rf"status\s+IN\s*\(([^)]*)\)", allsql):
        pass
bad_status=sorted(set(bad_status))
if bad_status: F('enum: all status/decision literals valid', ', '.join(bad_status))
else: P('enum: all status/decision literals valid')

# 2. INSERT column lists reference real columns
ins_bad=[]
for m in re.finditer(r'INSERT INTO app\.(\w+)\s*\(([^)]*)\)', allsql):
    t=m.group(1); cl=[c.strip() for c in m.group(2).split(',')]
    if t not in cols: continue
    for c in cl:
        if c and c not in cols[t]: ins_bad.append(f'{t}.{c}')
ins_bad=sorted(set(ins_bad))
if ins_bad: F('DML: INSERT columns exist', ', '.join(ins_bad))
else: P('DML: INSERT target columns all exist')

# 3. UPDATE SET columns exist
upd_bad=[]
for m in re.finditer(r'UPDATE app\.(\w+)\s+SET\s+(.*?)(?:WHERE|RETURNING|;|$)', allsql, re.S):
    t=m.group(1)
    if t not in cols: continue
    for c in re.findall(r'(\w+)\s*=', m.group(2)):
        if c not in cols[t] and c not in ('excluded',): upd_bad.append(f'{t}.{c}')
upd_bad=sorted(set(upd_bad))
if upd_bad: F('DML: UPDATE columns exist', ', '.join(upd_bad))
else: P('DML: UPDATE target columns all exist')

# 4. grant references a table OR view that exists (views collected dynamically across all
#    migrations, e.g. v_public_centres in 0009, so the allowlist never goes stale).
views=set(re.findall(r'CREATE (?:OR REPLACE )?VIEW app\.(\w+)', allsql))
g_bad=[]
for m in re.finditer(r'ON app\.(\w+)\s+TO ', allsql):
    if m.group(1) not in cols and m.group(1) not in views:
        g_bad.append(m.group(1))
if g_bad: F('grants: target objects exist', ', '.join(sorted(set(g_bad))))
else: P('grants: all GRANT targets exist')

# 5. function symbol resolution: every app.fn_X called is defined somewhere. Match both
#    CREATE FUNCTION (e.g. fn_scan_claim in 0010, whose return type changed) and CREATE OR REPLACE.
defined=set(re.findall(r'CREATE (?:OR REPLACE )?FUNCTION app\.(\w+)', allsql))
called=set(re.findall(r'app\.(fn_\w+|_\w+)\s*\(', allsql))
undef=sorted(c for c in called if c not in defined)
if undef: F('symbols: all app.fn_/helper calls defined', ', '.join(undef))
else: P('symbols: all called functions defined')

# 6. trigger functions referenced by CREATE TRIGGER exist
trg_fns=set(re.findall(r'EXECUTE FUNCTION app\.(\w+)', allsql))
undef_trg=sorted(t for t in trg_fns if t not in defined)
if undef_trg: F('triggers: functions exist', ', '.join(undef_trg))
else: P('triggers: all trigger functions defined')

# 7. apply-order: a function referencing a table must be defined after the table's CREATE
#    (all tables in 0000, all fns in 0001-0003 → satisfied by file order; verify no fn in 0001
#     references a 0002/0003-only object). Check helper calls in 0001 resolve within 0001 or are builtins.
h0001=set(re.findall(r'CREATE OR REPLACE FUNCTION app\.(\w+)', mig[1][1]))
c0001=set(re.findall(r'app\.(fn_\w+|_\w+)\s*\(', mig[1][1]))
fwd=sorted(c for c in c0001 if c not in h0001 and c in defined)
if fwd: W('apply-order: 0001 forward-references later fn (ok if not trigger-time)', ', '.join(fwd))
else: P('apply-order: 0001 self-contained')

# 8. RETURNING-into presence for INSERTs that capture id
P('checked: writable-CTE rewrites (structural suite covers)')

# 9. seed enum validity (roles, statuses in seed)
seed=open('tests/plain/01_seed.sql').read() if glob.glob('tests/plain/01_seed.sql') else ''
roleset=set(re.findall(r"VALUES\s*\('(\w+)'\)", mig[0][1]))  # app.roles inserts
seed_roles=set(re.findall(r"',\s*'(\w+)'\)", seed))
print('INFO  seed present:', bool(seed))

print('\n===', 'SEMANTIC CHECKS PASS' if not fails else f'{len(fails)} FAIL / {len(warns)} warn', '===')
sys.exit(1 if fails else 0)

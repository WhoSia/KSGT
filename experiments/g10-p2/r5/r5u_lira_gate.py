"""R5u scored decision-line contract; flags unscored added research conclusions."""
import re
import hashlib
PAT=re.compile(r'^L(\d{3}) \| E=(0\.\d\d|1\.00) \| P=(0\.\d\d|1\.00) \| (FACT|INFER|PLAN|HOLD) \| \[([A-Z0-9,]+)\] \| (.+)$')
SOURCES={'R1','R2','R3','R4'}
class LineHold(ValueError):pass
def audit_lines(s):
    rows=[]
    for idx,line in enumerate(s.splitlines(),1):
        m=PAT.fullmatch(line)
        if not m or int(m[1])!=idx:raise LineHold('UNSCORED_OR_NUMBERING')
        if not set(m[5].split(',')).issubset(SOURCES):raise LineHold('SOURCE_UNVERIFIED')
        if m[4]=='HOLD' and ('HOLD' not in m[6] and '보류' not in m[6]):raise LineHold('HOLD_NOT_VISIBLE')
        rows.append({'line':idx,'E':float(m[2]),'P':float(m[3]),'kind':m[4],'sources':m[5].split(','),'sha256':hashlib.sha256(line.encode('utf-8')).hexdigest()})
    if not rows or s.endswith('\n\n'):raise LineHold('EMPTY_OR_BLANK')
    return rows

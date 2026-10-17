"""Original-text dependency classification; no titles, caller flags or semantic gold."""
import hashlib,json,unicodedata
def strict(forms):
    if not isinstance(forms,list) or not forms or any(type(x) is not str for x in forms):raise ValueError('Nonempty original source-unit list required')
    return hashlib.sha256(json.dumps(forms,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def contiguous(big,small):
    return any(big[i:i+len(small)]==small for i in range(len(big)-len(small)+1))
def verify_structure_binding(forms,source_identity):
    """Bind source structure only; archive custody still requires raw witnesses."""
    if not isinstance(source_identity,dict) or source_identity.get('strict_structure')!=strict(forms):raise ValueError('Source identity does not bind these unchanged units')
    return {'status':'VERIFIED_ORIGINAL_UNIT_STRUCTURE_BINDING_ONLY','archive_custody':'REQUIRES_EXTERNAL_RAW_WITNESS','human_ground_truth':None}
def normalize(forms):return ''.join(c for c in unicodedata.normalize('NFC',''.join(forms)) if not c.isspace())
def historical_forms(doc):
    """Recover actual observed fields; sentence labels do not certify segmentation."""
    views=[]
    for field,text_key in [('paragraph','form'),('sentence','form'),('sentence','original_form')]:
        units=doc.get(field)
        if units is None:continue
        if not isinstance(units,list):raise ValueError('Historical source units must be lists')
        forms=[x[text_key] for x in units if isinstance(x,dict) and text_key in x and x[text_key] not in ('',None)]
        if forms:
            strict(forms);views.append((field+'.'+text_key,forms))
    if not views:raise ValueError('No independently parsed historical prose field')
    return views
def extend(a,b,i,j,width):
    if i<0 or j<0 or width<=0 or a[i:i+width]!=b[j:j+width] or len(a[i:i+width])!=width:raise ValueError('Exact original anchor required')
    left=0
    while i-left>0 and j-left>0 and a[i-left-1]==b[j-left-1]:left+=1
    right=width
    while i+right<len(a) and j+right<len(b) and a[i+right]==b[j+right]:right+=1
    return {'left_start':i-left,'right_start':j-left,'characters':left+right,'sha256':hashlib.sha256(a[i-left:i+right].encode()).hexdigest()}
def classify(left,right,passage=None):
    strict(left);strict(right)
    if left==right:return 'EXACT_STRUCTURE'
    if contiguous(left,right) or contiguous(right,left):return 'EXACT_CONTIGUOUS_UNIT_SUBSET'
    if ''.join(left)==''.join(right):return 'EXACT_CODEPOINT_RESEGMENTATION'
    if normalize(left)==normalize(right):return 'NORMALIZED_ONLY'
    if passage is not None:
        a,b=''.join(left),''.join(right);i,j,n=passage['left_start'],passage['right_start'],passage['characters']
        if type(n) is not int or n<80 or i<0 or j<0 or len(a[i:i+n])!=n or a[i:i+n]!=b[j:j+n] or hashlib.sha256(a[i:i+n].encode()).hexdigest()!=passage['sha256']:raise ValueError('Unwitnessed shared-passage assertion')
        return 'VERIFIED_SHARED_LONG_PASSAGE'
    return 'UNRESOLVED_SOURCE_RELATION'

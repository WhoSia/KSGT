import {solve,Task,Unit,Variant} from './r6d_realizer';
const v=(id:string,text:string,cost:number,focus?:string,requiresPrev?:string[],needsEvidence?:string[]):Variant=>({id,text,cost,focus,requiresPrev,needsEvidence});
const u=(id:string,variants:Variant[],requires:string[]=[],provides:string[]=[]):Unit=>({id,variants,requires,provides});
const task=(units:Unit[],preferences:Task['preferences']=[],requestedEvidence:string[]=[],availableEvidence:string[]=[]):Task=>({units,preferences,requestedEvidence,availableEvidence,known:[]});
const cases:Record<string,Task>={
 notice:task([
 u('exception',[v('explicit','수요일 4교시에도 열람실은 이용할 수 있습니다.',2,'reading'),v('contrast','다만 같은 시간에도 열람실은 이용할 수 있습니다.',0,'reading',['closure'])],['closure']),
 u('scope',[v('explicit','이번 변경은 수요일에만 적용됩니다.',1,'scope')],['closure']),
 u('closure',[v('explicit','수요일 4교시에는 대출 창구를 닫습니다.',0,'closure')],[],['closure']),
 u('resume',[v('explicit','대출 창구는 5교시에 다시 엽니다.',1,'closure'),v('short','5교시부터 다시 엽니다.',0,'closure',['closure'])],['closure'])], [{before:'closure',after:'exception',weight:3},{before:'exception',after:'resume',weight:2},{before:'resume',after:'scope',weight:1}]),
 science:task([
 u('result',[v('explicit','조건 A와 B에서 색이 바뀌기까지 각각 42초와 35초가 걸렸다.',0,'result')],[],['result']),
 u('limit',[v('explicit','두 조건의 온도를 기록하지 않아 시간 차이의 원인은 알 수 없다.',1,'limit'),v('linked','다만 온도를 기록하지 않아 이 차이의 원인은 알 수 없다.',0,'limit',['result'])],['result']),
 u('plan',[v('explicit','다음 실험에서는 온도를 일정하게 유지할 예정이다.',0,'plan')])],[{before:'result',after:'limit',weight:3},{before:'limit',after:'plan',weight:2}],['temperature']),
 referent:task([
 u('introduce',[v('intro','실험에는 압력 센서와 온도 센서를 사용했다.',0,'both')],[],['sensor']),
 u('pressure',[v('explicit','압력 센서는 압력의 변화를 감지한다.',1,'pressure')],['sensor']),
 u('temperature',[v('explicit','온도 센서는 온도의 변화를 감지한다.',1,'temperature')],['sensor']),
 u('convert',[v('explicit','압력 센서는 측정값을 전기 신호로 변환한다.',2,'pressure'),v('anaphor','이 센서는 측정값을 전기 신호로 변환한다.',0,'pressure',['pressure'])],['sensor'])], [{before:'pressure',after:'temperature',weight:2},{before:'temperature',after:'convert',weight:2}]),
 argument:task([
 u('proposal',[v('explicit','학교 도서관의 저녁 개방 시간을 늘리는 방안을 검토할 필요가 있다.',0,'proposal')],[],['proposal']),
 u('observation',[v('explicit','현재 도서관은 오후 여섯 시에 문을 닫는다.',0,'obs')]),
 u('missing',[v('explicit','개방 시간 연장이 필요한지 판단하려면 학생 이용 수요를 조사해야 한다.',0,'missing')],['proposal'])],[{before:'observation',after:'proposal',weight:1},{before:'proposal',after:'missing',weight:3}],['demand']),
 // Same set of previously emitted units can have different last focus; greedy may paint itself into a corner.
 history:task([u('a',[v('a','압력 센서를 점검했다.',0,'pressure')]),u('b',[v('b','온도 센서를 점검했다.',0,'temperature')]),u('c',[v('c','이 센서의 압력 측정값을 기록했다.',0,'pressure',['pressure'])])],[{before:'a',after:'b',weight:1},{before:'b',after:'c',weight:2}]),
 unsupported:task([u('a',[v('fact','측정은 아직 끝나지 않았다.',0,'a')]),u('b',[v('bad','측정 결과를 확인했다.',0,'b',undefined,['measurement'])])],[],['measurement']),
 relation_anchor:task([
 u('first',[v('explicit','첫 실험에서는 센서의 반응이 느렸다.',0,'sensor')],[],['first']),
 u('setup',[v('explicit','센서의 설치 위치도 기록했다.',0,'sensor')],['first']),
 u('second',[v('explicit','두 번째 실험에서는 센서가 빠르게 반응했다.',2,'sensor'),{...v('contrast','반면 두 번째 실험에서는 센서가 빠르게 반응했다.',0,'sensor',['sensor']),requiresPrevUnit:['first']}],['first'])],[{before:'setup',after:'second',weight:3}]),
 literary:task([u('sound',[v('explicit','복도 끝에서 짧은 소리가 들렸다.',0,'sound')],[],['sound']),u('wait',[v('explicit','나는 문 앞에 멈춰 섰다.',0,'wait')]),u('reveal',[v('explicit','소리의 정체는 아직 알 수 없었다.',0,'reveal')],['sound'])],[{before:'wait',after:'sound',weight:2},{before:'sound',after:'reveal',weight:1}])
};
// Independent exhaustive enumeration: no planner internals or state compression.
function oracle(t:Task){let best=Infinity;function walk(order:string[],focus:string,known:Set<string>,cost:number){if(order.length===t.units.length){best=Math.min(best,cost);return;}for(const x of t.units){if(order.includes(x.id)||!x.requires.every(a=>known.has(a)))continue;for(const y of x.variants){if(y.requiresPrev&&!y.requiresPrev.includes(focus)||y.requiresPrevUnit&&!y.requiresPrevUnit.includes(order.at(-1)??'')||!(y.needsEvidence??[]).every(e=>t.availableEvidence.includes(e)))continue;const p=t.preferences.reduce((s,p)=>s+(p.after===x.id&&!order.includes(p.before)?p.weight:0),0);walk([...order,x.id],y.focus??'',new Set([...known,...x.provides]),cost+y.cost+p);}}}walk([], '',new Set(t.known),0);return best;}
function check(ok:boolean){if(!ok)throw Error('TEST_FAILED');}
const result:Record<string,unknown>={};for(const [k,t] of Object.entries(cases)){const exact=solve(t),greedy=solve(t,'greedy'),fixed=solve(t,'fixed'),orderOnly=solve(t,'order_only');check((exact?.cost??Infinity)===oracle(t));if(greedy)check(exact!==null&&exact.cost<=greedy.cost);if(orderOnly)check(exact!==null&&exact.cost<=orderOnly.cost);result[k]={exact,greedy,fixed,orderOnly};}
check(solve(cases.unsupported)===null);check(solve(cases.science)!.missingEvidence.includes('temperature'));check(solve(cases.argument)!.missingEvidence.includes('demand'));
check(solve(cases.referent)!.variants.includes('anaphor')||solve(cases.referent)!.variants.includes('explicit'));
check(solve(cases.relation_anchor)!.variants.every(x=>x!=='contrast'));
// Remove the anchor on a copy to demonstrate the focus-only failure.
const weak=structuredClone(cases.relation_anchor);delete weak.units[2].variants[1].requiresPrevUnit;const weakResult=solve(weak)!;check(weakResult.variants.includes('contrast')&&weakResult.order.join(',')==='first,setup,second');result.focus_only_counterexample=weakResult;
let seed=927;function rnd(n:number){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>8)%n;}
let greedyLoss=0,greedyDead=0,feasible=0;for(let k=0;k<250;k++){const units=Array.from({length:4},(_,i)=>u('u'+i,[v('a','가.',rnd(4),'f'+i),{...v('b','나.',rnd(4),'f'+i,['f'+rnd(4)]),requiresPrevUnit:['u'+rnd(4)]}]));const preferences:Task['preferences']=[];for(const a of units)for(const b of units)if(a!==b&&rnd(3)===0)preferences.push({before:a.id,after:b.id,weight:rnd(7)});const t=task(units,preferences),e=solve(t),g=solve(t,'greedy');check((e?.cost??Infinity)===oracle(t));if(e){feasible++;if(!g)greedyDead++;else if(g.cost>e.cost)greedyLoss++;}}
const sensitivity:Record<string,number>={};
for(let a=0;a<=4;a++)for(let b=0;b<=4;b++){const t=structuredClone(cases.referent);t.units[3].variants[0].cost=a;t.preferences[1].weight=b;const e=solve(t)!;const key=e.variants.includes('anaphor')?'anaphor':'explicit';sensitivity[key]=(sensitivity[key]??0)+1;check(e.cost===oracle(t));}
console.log(JSON.stringify({authored:result,sensitivity,synthetic:{checked:250,feasible,greedyLoss,greedyDead},limits:'Manual fact-equivalent variant labels and developer costs. No independent prose ratings.'},null,2));

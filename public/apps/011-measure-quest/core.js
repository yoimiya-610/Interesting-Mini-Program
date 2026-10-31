'use strict';
(() => {
  const MAX_MOVES=200,copy=x=>JSON.parse(JSON.stringify(x));
  const ring=[[0,1],[1,2],[2,3],[3,0]],hub=[[0,1],[0,2],[0,3]],fork=[[0,1],[1,2],[1,3]];
  const rows=[
    ['first',['满与空之间','Between full and empty'],[3,5],[3,2],true,null,2,['先装满 B，再观察它能给 A 多少。','Fill B first; see how much A can receive.']],
    ['remainder',['把余量留下','Keep a remainder'],[2,7],[2,3],true,null,4,['小容器也可以作为反复使用的量尺。','A small vessel can act as a reusable measure.']],
    ['four',['多出的一单位','One unit more'],[3,5],[3,4],true,null,6,['不只能从大倒向小；空位同样能帮你计量。','Try both directions. Empty space can measure too.']],
    ['return',['归零之前','Before returning to zero'],[4,7],[0,5],true,null,8,['两个目标都要满足；先得到 5 还不一定完成。','Both targets matter; reaching 5 alone may not finish.']],
    ['halves',['八分成两半','Eight in two halves'],[8,5,3],[4,4,0],false,null,7,['没有水龙头，所有空位都来自已有的水。','There is no tap: every empty space comes from redistributing the same water.']],
    ['reserve',['留下两份二','Two separate twos'],[9,5,4],[2,5,2],false,null,8,['让中间容器装满，同时给两侧各留 2。','Fill the middle vessel while keeping 2 on each side.']],
    ['equal',['十的平衡','Balance ten'],[10,7,3],[5,5,0],false,null,9,['一次看似离开目标的倾倒，也可能制造必要的空位。','A move away from the target may create useful space.']],
    ['twelve',['十二的分界','Divide twelve'],[12,7,5],[6,6,0],false,null,11,['同时管理两份 6；不要只盯住一个容器。','Plan for two sixes, not just one vessel.']],
    ['four-way',['四个位置','Four places'],[10,7,4,3],[6,0,2,2],false,null,9,['多一个容器带来更多选择，也带来额外的目标约束。','An extra vessel adds choices and another target constraint.']],
    ['small-pair',['一与一','One and one'],[11,8,5,3],[9,1,1,0],false,null,10,['要保住已做出的 1，同时制造另一个 1。','Keep one measured unit while making another.']],
    ['hub',['必经的中转站','The central transfer'],[11,8,5,3],[10,0,0,1],false,hub,10,['只有 A 与其他容器连通；B、C、D 之间不能直接倒。','Only A connects to the other vessels. B, C, and D cannot pour directly between each other.']],
    ['fork',['分叉的管路','A branching route'],[12,8,5,3],[3,8,0,1],false,fork,11,['B 是唯一中转点，保留 D 的 1 之后还要重组上游。','B is the only junction. After reserving 1 in D, reorganize upstream.']],
    ['junction',['四份都到位','Every portion in place'],[12,8,5,3],[2,3,5,2],false,fork,12,['最后四个容器都不能空，C 必须恰好装满。','All four vessels must hold water at the end, with C exactly full.']],
    ['around',['沿环绕行','Around the ring'],[12,7,5,3],[2,6,1,3],false,ring,12,['A 与 C、B 与 D 不相连；用邻接的空位转运。','A–C and B–D are disconnected. Move capacity through neighboring vessels.']],
    ['two-ones',['环上的两份一','Two ones on a ring'],[13,8,5,3],[11,0,1,1],false,ring,13,['C 与 D 各留 1，清空 B，同时把 11 带回 A。','Leave 1 in both C and D, empty B, and return 11 to A.']],
    ['last-drop',['最后的空位','The final empty space'],[12,7,5,3],[5,3,4,0],false,ring,14,['让 D 最后归零前，先想清楚其余三份如何同时保住。','Before emptying D for the last time, plan how to retain the other three portions.']]
  ];
  const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  const LEVELS=freeze(rows.map(([id,name,caps,goal,tap,links,par,idea],i)=>({id,name,caps,goal,tap,links,par,idea,number:i+1,start:tap?caps.map(()=>0):caps.map((c,i)=>i?0:c)})));
  const level=id=>LEVELS.find(l=>l.id===id),sum=a=>a.reduce((s,n)=>s+n,0);
  function validState(l,s){return !!l&&Array.isArray(s)&&s.length===l.caps.length&&s.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=l.caps[i])&&(l.tap||sum(s)===sum(l.start));}
  const won=(l,s)=>validState(l,s)&&s.every((v,i)=>v===l.goal[i]);
  const connected=(l,i,j)=>i!==j&&(!l.links||l.links.some(([a,b])=>a===i&&b===j||a===j&&b===i));
  function step(l,s,action){
    if(!validState(l,s)||typeof action!=='string')return null;
    const next=[...s];let m;
    if((m=action.match(/^([fe])([0-3])$/))){const i=+m[2];if(!l.tap||i>=s.length)return null;next[i]=m[1]==='f'?l.caps[i]:0;}
    else if((m=action.match(/^p([0-3])([0-3])$/))){const i=+m[1],j=+m[2];if(i>=s.length||j>=s.length||!connected(l,i,j))return null;const amount=Math.min(s[i],l.caps[j]-s[j]);next[i]-=amount;next[j]+=amount;}
    else return null;
    return next.some((v,i)=>v!==s[i])?next:null;
  }
  function actions(l,s){const out=[];for(let i=0;i<l.caps.length;i++){if(l.tap)out.push('f'+i,'e'+i);for(let j=0;j<l.caps.length;j++)if(connected(l,i,j))out.push('p'+i+j);}return out.filter(a=>step(l,s,a));}
  function replay(l,path){
    if(!l||!Array.isArray(path)||path.length>MAX_MOVES)return null;
    let state=[...l.start];const states=[[...state]];
    for(const a of path){if(won(l,state))return null;state=step(l,state,a);if(!state)return null;states.push(state);}
    return {state,states,won:won(l,state)};
  }
  function solve(l,from=l.start){
    if(!validState(l,from))return null;
    const key=s=>s.join(','),queue=[[...from]],parents=new Map([[key(from),null]]);
    for(let at=0;at<queue.length;at++){const s=queue[at],k=key(s);
      if(won(l,s)){const path=[];let current=k;while(parents.get(current)){const {previous,action}=parents.get(current);path.push(action);current=previous;}return {path:path.reverse(),visited:parents.size};}
      for(const action of actions(l,s)){const next=step(l,s,action),id=key(next);if(!parents.has(id)){parents.set(id,{previous:k,action});queue.push(next);}}
    }return null;
  }
  function fresh(){return {version:1,level:LEVELS[0].id,drafts:{},records:{},note:''};}
  function draft(){return {path:[],redo:[],assisted:false};}
  function restore(data){
    if(!data||data.version!==1||!level(data.level)||typeof data.note!=='string'||[...data.note].length>2000||!data.drafts||typeof data.drafts!=='object'||Array.isArray(data.drafts)||!data.records||typeof data.records!=='object'||Array.isArray(data.records))return null;
    const out=fresh();out.level=data.level;out.note=data.note;
    for(const [id,d]of Object.entries(data.drafts)){
      const l=level(id);if(!l||!d||typeof d.assisted!=='boolean'||!Array.isArray(d.redo)||!Array.isArray(d.path)||d.path.length+d.redo.length>MAX_MOVES||!replay(l,[...d.path,...d.redo.slice().reverse()]))return null;
      out.drafts[id]={path:[...d.path],redo:[...d.redo],assisted:d.assisted};
    }
    for(const [id,r]of Object.entries(data.records)){
      const l=level(id);if(!l||!r||typeof r!=='object'||Array.isArray(r))return null;out.records[id]={};
      for(const kind of Object.keys(r)){if(!['clean','helped'].includes(kind)||!replay(l,r[kind])?.won)return null;out.records[id][kind]=[...r[kind]];}
    }return out;
  }
  function gcd(a,b){while(b)[a,b]=[b,a%b];return a;}
  function classic(a,b,target){if(![a,b,target].every(Number.isInteger)||a<1||b<1||a>12||b>12||target<1||target>12)return null;const divisor=gcd(a,b);return {divisor,possible:target<=Math.max(a,b)&&target%divisor===0};}
  globalThis.MeasureQuest=Object.freeze({LEVELS,MAX_MOVES,copy,level,validState,won,connected,step,actions,replay,solve,fresh,draft,restore,classic});
})();

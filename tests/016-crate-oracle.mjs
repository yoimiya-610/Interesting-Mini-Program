// Independent 0–1 BFS: every player cell is a state; walks cost zero and pushes one.
// No production parser, reachable-region canonicalization or goal-matching pruning.
export function oracle(rows,{freezeGoals=false,cap=800000}={}){
 const w=rows[0].length,h=rows.length,floor=new Set(),goals=new Set(),boxes=[];let player;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,c=rows[y][x];if(c!=='#')floor.add(i);if('.+*'.includes(c))goals.add(i);if('$*'.includes(c))boxes.push(i);if('@+'.includes(c))player=i;}
 const offsets=[-w,w,-1,1],key=(p,b)=>p+'|'+b.join(','),q=new Map(),dist=new Map(),initial={p:player,b:boxes.sort((a,b)=>a-b),cost:0};let head=0,tail=1,expanded=0;q.set(0,initial);dist.set(key(player,initial.b),0);
 while(head<tail){const s=q.get(head);q.delete(head++);if(s.cost!==dist.get(key(s.p,s.b)))continue;expanded++;if(s.b.every(v=>goals.has(v)))return {status:'solved',pushes:s.cost,expanded,visited:dist.size};
  for(const offset of offsets){const p=s.p+offset;if(!floor.has(p))continue;const index=s.b.indexOf(p),b=[...s.b];let cost=s.cost;if(index>=0){if(freezeGoals&&goals.has(p))continue;const to=p+offset;if(!floor.has(to)||b.includes(to))continue;const vertical=!floor.has(to-w)||!floor.has(to+w),horizontal=!floor.has(to-1)||!floor.has(to+1);if(!goals.has(to)&&vertical&&horizontal)continue;b[index]=to;b.sort((a,b)=>a-b);cost++;}const id=key(p,b);if(dist.has(id)&&dist.get(id)<=cost)continue;if(dist.size>=cap)return {status:'limit',expanded,visited:dist.size};dist.set(id,cost);const next={p,b,cost};if(cost===s.cost)q.set(--head,next);else q.set(tail++,next);}
 }return {status:'unsolvable',expanded,visited:dist.size};
}

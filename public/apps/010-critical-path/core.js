'use strict';
/* Finish-to-start CPM with a common virtual project finish. No resource model. */
(() => {
  const MAX_TASKS=24, MAX_SLOTS=8;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const text=(x,n)=>typeof x==='string'&&[...x].length<=n;
  const taskValid=t=>t&&/^T[1-9]\d{0,5}$/.test(t.id)&&text(t.name,80)&&t.name.trim()&&
    (t.en===null||(text(t.en,100)&&t.en.trim()))&&Number.isInteger(t.duration)&&t.duration>=1&&t.duration<=99&&
    Array.isArray(t.deps)&&t.deps.length<=MAX_TASKS&&t.deps.every(d=>typeof d==='string')&&new Set(t.deps).size===t.deps.length;
  function analyze(tasks){
    if(!Array.isArray(tasks)||!tasks.length||tasks.length>MAX_TASKS||!tasks.every(taskValid))return {error:'invalid'};
    const by=new Map(tasks.map(t=>[t.id,t]));
    if(by.size!==tasks.length)return {error:'invalid'};
    for(const t of tasks)if(t.deps.some(d=>!by.has(d)||d===t.id))return {error:'dependency'};
    const next=Object.fromEntries(tasks.map(t=>[t.id,[]])),degree={};
    for(const t of tasks){degree[t.id]=t.deps.length;for(const d of t.deps)next[d].push(t.id);}
    const order=tasks.filter(t=>!degree[t.id]).map(t=>t.id);
    for(let i=0;i<order.length;i++)for(const id of next[order[i]])if(--degree[id]===0)order.push(id);
    if(order.length!==tasks.length)return {error:'cycle'};
    const rows={};
    for(const id of order){const t=by.get(id),es=Math.max(0,...t.deps.map(d=>rows[d].ef));rows[id]={id,es,ef:es+t.duration};}
    const finish=Math.max(...order.map(id=>rows[id].ef));
    for(const id of [...order].reverse()){
      const r=rows[id],t=by.get(id);r.lf=next[id].length?Math.min(...next[id].map(d=>rows[d].ls)):finish;
      r.ls=r.lf-t.duration;r.float=r.ls-r.es;
      r.free=(next[id].length?Math.min(...next[id].map(d=>rows[d].es)):finish)-r.ef;
      r.critical=r.float===0;
    }
    const criticalEdges=[];let paths=0;const ways={};
    for(const id of order){
      const r=rows[id],t=by.get(id);
      ways[id]=r.critical?(t.deps.length?t.deps.reduce((s,d)=>s+(rows[d].critical&&rows[d].ef===r.es?ways[d]:0),0):1):0;
      for(const d of t.deps)if(r.critical&&rows[d].critical&&rows[d].ef===r.es)criticalEdges.push([d,id]);
      if(!next[id].length&&r.ef===finish)paths+=ways[id];
    }
    const sensitivity=tasks.map(t=>{
      const changed=copy(tasks);changed.find(x=>x.id===t.id).duration++;
      // Durations of 100 here are a calculation only, never a stored task.
      const end={};for(const id of order){const x=changed.find(x=>x.id===id);end[id]=Math.max(0,...x.deps.map(d=>end[d]))+x.duration;}
      return {id:t.id,delta:Math.max(...Object.values(end))-finish};
    });
    return {order,rows,finish,criticalEdges,paths,sensitivity,work:tasks.reduce((s,t)=>s+t.duration,0)};
  }
  function validProject(p){return p&&text(p.title,80)&&!analyze(p.tasks).error;}
  function cleanProject(p){return {title:p.title,tasks:p.tasks.map(t=>({id:t.id,name:t.name,en:t.en,duration:t.duration,deps:[...t.deps]}))};}
  function restore(data){
    if(!data||data.version!==1||!validProject(data.current)||!Array.isArray(data.slots)||data.slots.length>MAX_SLOTS)return null;
    const ids=new Set();for(const s of data.slots){if(!s||typeof s.id!=='string'||!/^s[\w-]{1,60}$/.test(s.id)||ids.has(s.id)||!validProject(s.project))return null;ids.add(s.id);}
    if(data.baseline!==null&&!ids.has(data.baseline))return null;
    return {version:1,current:cleanProject(data.current),slots:data.slots.map(s=>({id:s.id,project:cleanProject(s.project)})),baseline:data.baseline};
  }
  const definitions=[
    ['exhibit',['社区小展','Community exhibition'],['比较征集与场地两条支线。试把 T3 加长 1，再加长 3，观察它何时改变完工时间。','Compare the artwork and venue branches. Add 1, then 3 units to T3 and observe when the project finish changes.'],[
      ['确定主题','Choose a theme',2,[]],['征集作品','Collect works',5,[1]],['确认场地','Confirm venue',3,[1]],['编辑说明','Edit captions',2,[2]],['设计展板','Design panels',3,[4]],['准备展架','Prepare stands',2,[3]],['布置展厅','Install display',2,[5,6]],['巡检开放','Inspect and open',1,[7]]]],
    ['repair',['修缮工作坊','Repair workshop'],['采购与空间整理并行。延长采购后，留意关键任务怎样从工具支线转移。','Procurement and room preparation run in parallel. Extend procurement and watch critical work migrate between branches.'],[
      ['检查损坏','Inspect damage',2,[]],['列出零件','List parts',1,[1]],['采购零件','Buy parts',4,[2]],['整理工作区','Prepare workspace',2,[1]],['借用工具','Borrow tools',3,[4]],['拆解清洁','Disassemble and clean',2,[5]],['安装替换件','Install replacements',3,[3,6]],['功能测试','Functional test',2,[7]],['整理维护笔记','Write care notes',1,[8]]]],
    ['zine',['独立小刊','Independent zine'],['文字和图像汇合后才能排版。缩短较快支线不一定缩短发行时间。','Text and images must join before layout. Shortening the faster branch may not advance publication.'],[
      ['确定选题','Set the topic',1,[]],['采访收集','Collect interviews',4,[1]],['写作初稿','Draft articles',3,[2]],['拍摄图像','Create photographs',5,[1]],['编辑校对','Edit and proofread',2,[3]],['筛选图像','Select images',2,[4]],['版面设计','Design layout',3,[5,6]],['打印样刊','Print a proof',1,[7]],['检查装订','Check binding',1,[8]],['印制发行','Print and distribute',2,[9]]]],
    ['sensor',['环境记录器','Environment logger'],['硬件和数据界面交叉依赖。试删除非必需的依赖，并比较总工时与工期。','Hardware and data views cross at integration. Test a removable dependency and compare task duration sum with elapsed project time.'],[
      ['定义测量目标','Define measurements',2,[]],['选择传感器','Select sensors',2,[1]],['采购元件','Order components',5,[2]],['定义数据格式','Define data format',2,[1]],['编写固件','Write firmware',4,[2,4]],['绘制外壳','Design enclosure',3,[2]],['装配原型','Assemble prototype',2,[3,6]],['实现图表','Build data charts',4,[4]],['联调记录','Integrate and log',3,[5,7,8]],['对照测试','Run reference tests',2,[9]]]],
    ['meal',['多人晚餐','Shared dinner'],['备料与餐桌可并行；若同一个人做所有事，这里的工期会偏乐观。试加依赖表达必须串行的步骤。','Prep and table setting can overlap. A single cook would need extra sequencing; add dependencies to express that limit.'],[
      ['确认菜单','Agree on menu',1,[]],['采购食材','Buy ingredients',3,[1]],['清洗切配','Wash and chop',2,[2]],['慢煮主菜','Slow-cook main',5,[3]],['烘焙点心','Bake dessert',4,[3]],['制作冷盘','Make cold dishes',2,[3]],['布置餐桌','Set the table',2,[1]],['最后调味','Finish seasoning',1,[4]],['摆盘开餐','Plate and serve',1,[5,6,7,8]]]],
    ['garden',['屋顶种植','Rooftop planting'],['种植依赖容器、土与幼苗三路汇合。尝试让多条支线同时成为关键路径。','Planting waits for containers, soil, and seedlings. Try making several branches critical at once.'],[
      ['检查位置','Inspect location',1,[]],['设计种植布局','Plan layout',2,[1]],['准备容器','Prepare containers',3,[2]],['取得适用土','Obtain suitable soil',4,[2]],['育苗','Raise seedlings',6,[1]],['铺设排水层','Install drainage',2,[3]],['混合填土','Mix and fill soil',2,[4,6]],['移栽','Transplant',1,[5,7]],['试运行浇水','Test watering',2,[8]],['建立养护记录','Start care log',1,[9]]]],
    ['podcast',['声音访谈','Interview episode'],['音频后期与节目说明分别汇合。加长支线，观察自由时差与总时差的区别。','Audio post-production and show notes join at release. Extend a branch and compare free float with total float.'],[
      ['制定访谈提纲','Outline interview',2,[]],['联系嘉宾','Arrange guest',3,[1]],['准备录音环境','Prepare recording room',2,[1]],['录制访谈','Record interview',2,[2,3]],['剪辑音频','Edit audio',4,[4]],['混音检查','Mix and check',2,[5]],['整理节目说明','Write show notes',3,[4]],['制作封面','Create cover art',2,[1]],['嘉宾确认','Guest review',2,[6,7]],['整理发布包','Prepare release',1,[8,9]],['发布检查','Publish and verify',1,[10]]]],
    ['fair',['校园科学日','School science day'],['展台、志愿者和材料三线协调。把一条关键线压短后，看看另一条会不会接手瓶颈。','Coordinate exhibits, volunteers, and materials. After shortening one critical branch, check whether another becomes the bottleneck.'],[
      ['确定活动目标','Set event goals',2,[]],['设计演示','Design demonstrations',3,[1]],['材料清单','List materials',1,[2]],['准备材料','Prepare materials',4,[3]],['布置方案','Plan room layout',2,[2]],['制作展台','Build stations',4,[5]],['招募志愿者','Recruit volunteers',5,[1]],['编写安全简报','Write safety briefing',2,[2]],['培训演练','Train volunteers',2,[7,8]],['综合彩排','Run full rehearsal',2,[4,6,9]],['修订说明','Revise instructions',1,[10]],['开放活动','Open event',1,[11]]]]
  ];
  const TEMPLATES=definitions.map(([key,name,prompt,tasks])=>({key,name,prompt,tasks:tasks.map(([name,en,duration,deps],i)=>({id:'T'+(i+1),name,en,duration,deps:deps.map(n=>'T'+n)}))}));
  function template(key){const t=TEMPLATES.find(t=>t.key===key);if(!t)return null;return {title:'',tasks:copy(t.tasks)};}
  const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const name=(t,lang)=>lang==='en'&&t.en!==null?t.en:t.name;
  // Conservative widths keep long local-script labels readable without a font dependency.
  // Wrap whole graphemes and retain every character, including inter-word spaces.
  function lines(value,width){
    const clusters=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value)].map(s=>s.segment);
    const size=s=>/^[\x20-\x7e]$/.test(s)?(/[MWmw]/.test(s)?16:/[A-Z]/.test(s)?12:/[ il.,:;!|'`]/.test(s)?6:10):20,out=[];
    for(let at=0;at<clusters.length;){
      let end=at,total=0,space=-1;
      while(end<clusters.length&&(end===at||total+size(clusters[end])<=width)){total+=size(clusters[end]);if(clusters[end]===' ')space=end;end++;}
      if(end<clusters.length&&space>=at+(end-at)/2)end=space+1;
      out.push(clusters.slice(at,end).join(''));at=end;
    }
    return out.length?out:[''];
  }
  function svg(project,lang='en',width=1000){
    const a=analyze(project.tasks);if(a.error)throw new Error('Invalid graph');
    const w=Math.max(760,width),left=Math.min(340,w*.4),right=48,scale=(w-left-right)/a.finish;
    const title=project.title||(lang==='en'?'010 · Critical Path Desk':'010 · 关键路径台'),titleLines=lines(title,w-32),top=titleLines.length*24+80;
    const rows=project.tasks.map(t=>({task:t,label:lines(t.id+' '+name(t,lang),left-110)}));
    const h=top+rows.reduce((sum,row)=>sum+Math.max(70,row.label.length*22+34),0)+50;
    const multiline=(parts,x,y,role,id='')=>`<text data-role="${role}"${id?` data-task-id="${id}"`:''} xml:space="preserve">${parts.map((line,i)=>`<tspan x="${x}" y="${y+i*22}">${escape(line)}</tspan>`).join('')}</text>`;
    let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"><title>${escape(title)}</title><rect width="${w}" height="${h}" fill="#faf7ef"/><g font-family="Arial,SimHei,sans-serif" font-size="16" fill="#25363e">${multiline(titleLines,16,28,'project-title')}<text x="16" y="${top-38}">${lang==='en'?'Task / start → finish':'任务 / 开始 → 结束'}</text><text x="${left-16}" y="${top-38}" text-anchor="end">${lang==='en'?'Duration':'工时'}</text>`;
    const step=Math.max(1,Math.ceil(a.finish/8)),ticks=[];for(let t=0;t<a.finish;t+=step)ticks.push(t);ticks.push(a.finish);
    for(const t of ticks){const x=left+t*scale;s+=`<path d="M${x} ${top-10}V${h-50}" stroke="#d7d8cf"/><text x="${x}" y="${top-18}" text-anchor="middle">${t}</text>`;}
    let y=top;
    for(const {task:t,label}of rows){const r=a.rows[t.id],height=Math.max(70,label.length*22+34),barY=y+height/2-12;
      const status=(r.critical?(lang==='en'?'Critical':'关键'):(lang==='en'?'Float ':'总时差 ')+r.float)+' · '+r.es+' → '+r.ef;
      s+=multiline(label,16,y+18,'task-label',t.id)+`<text data-role="task-status" x="16" y="${y+label.length*22+20}">${status}</text><rect data-task-bar="${t.id}" x="${left+r.es*scale}" y="${barY}" width="${Math.max(.5,t.duration*scale)}" height="25" rx="2" fill="${r.critical?'#b84b35':'#387583'}"/><text data-role="task-duration" x="${left-16}" y="${barY+18}" text-anchor="end">${t.duration}</text>`;
      if(r.float)s+=`<path d="M${left+r.ef*scale} ${barY+13}H${left+r.lf*scale}" stroke="#387583" stroke-width="3" stroke-dasharray="4 4"/>`;
      y+=height;
    }
    s+=`<text x="16" y="${h-18}">${lang==='en'?'Solid: duration · Dashed: total float · Red + label: critical':'实线：工时 · 虚线：总时差 · 红色与文字：关键任务'}</text></g></svg>`;return s;
  }
  function csv(project,lang='en'){
    const a=analyze(project.tasks),cell=x=>'"'+String(x).replaceAll('"','""')+'"';
    return ['id,name,duration,predecessors,early_start,early_finish,late_start,late_finish,total_float,free_float,critical',...project.tasks.map(t=>{const r=a.rows[t.id];return [t.id,name(t,lang),t.duration,t.deps.join(' '),r.es,r.ef,r.ls,r.lf,r.float,r.free,r.critical].map(cell).join(',');})].join('\r\n');
  }
  globalThis.CriticalPath=Object.freeze({MAX_TASKS,MAX_SLOTS,copy,analyze,restore,TEMPLATES,template,name,svg,csv});
})();

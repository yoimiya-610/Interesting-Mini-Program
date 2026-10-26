import { readFileSync } from 'node:fs';
const list=JSON.parse(readFileSync(new URL('../programs.json',import.meta.url),'utf8'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const next=String(Math.max(0,...list.map(p=>Number(p.id)))+1).padStart(3,'0');
console.log(JSON.stringify({beijingDate:today,nextId:next,alreadyCreatedToday:list.filter(p=>p.created===today).map(p=>p.id),recent:list.slice(-7).map(({id,title,category,style,interaction})=>({id,title,category,style,interaction}))},null,2));

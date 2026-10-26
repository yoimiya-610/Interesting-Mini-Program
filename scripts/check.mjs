import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const list=JSON.parse(read('programs.json')), categories=['文科','工科','理科','游戏','生活'];
assert(list.length>0,'需要至少一个程序');
for(let i=0;i<list.length;i++){
  const p=list[i];assert.equal(p.id,String(i+1).padStart(3,'0'),'编号必须连续、唯一、递增');
  assert(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(p.slug),'slug 格式不合法');
  assert(categories.includes(p.category),'分类不合法');assert(/^\d{4}-\d{2}-\d{2}$/.test(p.created),'日期格式不合法');
  for(const key of ['title','subtitle','description','style','interaction'])assert(typeof p[key]==='string'&&p[key].length>0,`缺少 ${key}`);
  assert(Array.isArray(p.tags)&&p.tags.length>0,'缺少标签');
  const html=read(`public/apps/${p.id}-${p.slug}/index.html`);
  assert(html.includes(`<title>${p.id}`),`${p.id} 页面标题缺少编号`);
  assert(read('index.md').includes(`/apps/${p.id}-${p.slug}/`),'Markdown 索引缺少链接');
  assert(read('public/index.html').includes(`apps/${p.id}-${p.slug}/`),'网页索引缺少链接');
  assert(read('CHANGELOG.md').includes(`### ${p.id} `),'缺少更新日志');
  assert(readdirSync(resolve(root,'tests')).some(f=>f.startsWith(p.id+'-')),`${p.id} 缺少功能测试`);
  if(i>0){const prev=list[i-1];assert(p.interaction!==prev.interaction||p.style!==prev.style,'相邻程序至少需要不同玩法或风格');}
}
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=resolve(dir,n);return statSync(p).isDirectory()?walk(p):[p]})}
for(const f of walk(resolve(root,'public'))){
  assert(!/(?:^|[\\/])(?:\.git|\.env|\.openai)(?:[\\/]|$)/.test(f),'公开目录含有私密配置');
  if(extname(f)==='.html'){
    const html=readFileSync(f,'utf8');assert(/<html[^>]+lang=/.test(html),`缺少语言: ${f}`);assert(html.includes('name="viewport"'),`缺少移动端声明: ${f}`);
    assert(!/<(?:script|link|img|iframe|audio|video|source)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\//i.test(html),`不允许远程运行依赖: ${f}`);
    for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\b(?:src|type)=/i.test(match[1]))new vm.Script(match[2],{filename:f});}
  }
}
console.log(`PASS: ${list.length} 个程序；编号、元数据、索引、日志、本地资源与 JavaScript 语法检查通过。`);

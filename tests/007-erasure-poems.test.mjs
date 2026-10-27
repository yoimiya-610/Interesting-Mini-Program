import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../public/apps/007-erasure-poems/core.js',import.meta.url),'utf8'),context);
const {PASSAGES,tokenize,wordsFor,normalize,poem,restore,wrap,svg}=context.ErasurePoems,plain=value=>JSON.parse(JSON.stringify(value));
test('中英对应词位与示例有效；选词保持底稿顺序，换行不丢词',()=>{
  for(const p of PASSAGES){const zh=wordsFor(p.id,'','zh'),en=wordsFor(p.id,'','en');assert.equal(zh.length,en.length);assert(en.every(s=>s.length>0&&!/[\u3400-\u9fff]/.test(s)));const data=normalize({selected:[...p.sample].reverse(),breaks:p.breaks},zh);assert.equal(data.selected.length,p.sample.length);const lines=poem(zh,data);assert.equal(lines.length,p.breaks.length+1);assert.equal(lines.join(''),data.selected.map(i=>zh[i]).join(''));assert.equal(poem(en,data,'en').length,lines.length);}
  const words=['甲','，','乙','丙'];assert.deepEqual(plain(normalize({selected:[3,1,0,3,-1,99,'2'],breaks:[2,3,99]},words)),{title:'',selected:[0,3],breaks:[3]});assert.deepEqual(plain(poem(words,{selected:[3,0],breaks:[0]})),['甲','丙']);
});
test('自己的中文逐字、英文按词，保留原文字符，拒绝空白与超限',()=>{
  const text="清晨，don't rush. café & 雨\n";const tokens=tokenize(text);assert.equal(tokens.join(''),text);assert(tokens.includes("don't"));assert(tokens.includes('café'));assert.deepEqual(plain(poem(tokenize('write a little poem'),{selected:[0,2,4,6]},'auto')),['write a little poem']);assert.deepEqual(plain(poem(tokenize('雨停以后'),{selected:[0,2,3]},'auto')),['雨以后']);for(const invalid of ['', '   ', '，。！？', 'a'.repeat(1201),Array(181).fill('word').join(' ')])assert.throws(()=>tokenize(invalid),{name:'RangeError'});assert.equal(tokenize('字'.repeat(180)).length,180);
});
test('坏纪录过滤无效选词与换行，保留合法草稿和标题，未知来源安全回退',()=>{
  const data=restore({version:1,source:'custom',custom:'rain and light',cover:true,drafts:{station:{selected:[0,2,999,2],breaks:[2,7],title:'诗'},custom:{selected:[0,4],breaks:[0],title:'My poem'}}});assert.equal(data.source,'custom');assert.deepEqual(plain(data.drafts.custom.selected),[0,4]);assert.equal(data.drafts.station.title,'诗');assert.deepEqual(plain(data.drafts.station.breaks),[2]);assert.equal(restore({version:1,source:'custom',custom:'!'}).source,'station');assert.equal(restore({version:99}),null);assert.equal(restore(null),null);
});
test('SVG 对用户内容进行 XML 转义，长诗换行与纸张高度足够，所有资源离线',()=>{
  const title='<script>alert("x")</script>&',result=svg(title,['诗'.repeat(100),'W'.repeat(200)],'自己的底稿','en');assert(result.includes('&lt;script&gt;'));assert(!result.includes('<script>'));assert(!/(?:href=|<image|<foreignObject)/i.test(result));assert(result.includes('Source: '));const height=Number(result.match(/height="(\d+)"/)[1]);assert(height>560);assert(wrap(['W'.repeat(200)]).every(line=>line.length<=25));assert.equal(wrap(['诗'.repeat(100)]).join(''),'诗'.repeat(100));
});

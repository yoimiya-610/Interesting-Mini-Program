import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../public/apps/008-pack-pick/core.js',import.meta.url),'utf8'),context);
const {template,validItem,parseLimit,amount,analyze,suggest,restore}=context.PackPick,plain=value=>JSON.parse(JSON.stringify(value));
const item=(id,grams,ml,priority=3,required=false,quantity=1)=>({id,name:id,grams,ml,quantity,priority,required,included:true,packed:false});
test('容量精确转换到整数，件数相乘；打包不释放容量，排除才改变总量',()=>{
  assert.equal(parseLimit('0.001',100000),1);assert.equal(parseLimit('0.29',100000),290);assert.equal(parseLimit('100.000',100000),100000);for(const bad of ['1.0001','-1','1e2','Infinity','','100.001'])assert.equal(parseLimit(bad,100000),null);assert.equal(amount(1001,'weight'),'1.001 kg');
  const items=[item('a',120,250,4,false,3),{...item('b',1000,2000),packed:true}],limits={grams:1000,ml:2000};const before=analyze(items,limits);assert.equal(before.grams,1360);assert.equal(before.ml,2750);assert.equal(before.packed,1);items[0].packed=true;const packed=analyze(items,limits);assert.equal(packed.grams,before.grams);assert.equal(packed.packed,4);items[0].included=false;assert.equal(analyze(items,limits).grams,1000);assert.equal(analyze(items,limits).pieces,1);
});
test('双约束精确取舍与独立穷举一致，包括必带、数量、零成本及同分规则',()=>{
  let seed=7341;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  for(let trial=0;trial<60;trial++){
    const items=Array.from({length:8},(_,i)=>item('i'+i,random(12),random(15),1+random(5),i===0&&trial%2===0,1+random(3))),limits={grams:10+random(60),ml:10+random(80)},original=JSON.stringify(items);let expected=null;
    for(let mask=0;mask<1<<items.length;mask++){if(items.some((i,index)=>i.required&&!(mask&(1<<index))))continue;const picked=items.filter((_,index)=>mask&(1<<index)),grams=picked.reduce((s,i)=>s+i.grams*i.quantity,0),ml=picked.reduce((s,i)=>s+i.ml*i.quantity,0),score=picked.reduce((s,i)=>s+i.priority,0);if(grams>limits.grams||ml>limits.ml)continue;if(!expected||score>expected.score||score===expected.score&&(grams<expected.grams||grams===expected.grams&&ml<expected.ml))expected={grams,ml,score};}
    const result=suggest(items,limits);assert.equal(result.possible,Boolean(expected));if(expected){assert.equal(result.grams,expected.grams);assert.equal(result.ml,expected.ml);assert.equal(result.score,expected.score);assert(items.filter(i=>i.required).every(i=>result.selected.includes(i.id)));}assert.equal(JSON.stringify(items),original);
  }
  const allZero=[item('required',0,0,1,true),item('optional',0,0,5)];assert.deepEqual(plain(suggest(allZero,{grams:0,ml:0}).selected),['required','optional']);const tie=[item('first',100,100,3),item('second',100,100,3)];assert.deepEqual(plain(suggest(tie,{grams:100,ml:100}).selected),['first']);
  const groups=[item('bundle',100,100,5,false,10),item('single',120,120,4)];assert.deepEqual(plain(suggest(groups,{grams:500,ml:500}).selected),['single']);
});
test('必带超重量或超空间拒绝生成假可行组合；18 行边界可计算',()=>{
  for(const limits of [{grams:0,ml:1000},{grams:1000,ml:0}])assert.equal(suggest([item('must',1,1,5,true)],limits).possible,false);
  const items=Array.from({length:18},(_,i)=>item('item-'+i,1,1));assert.equal(suggest(items,{grams:9,ml:9}).selected.length,9);assert.throws(()=>suggest([...items,item('extra',0,0)],{grams:9,ml:9}),{name:'RangeError'});
});
test('记录修复与严格导入隔离，拒绝缺少 ID、越界、重复、未知版本和非法必带状态',()=>{
  const good=item('good',123,456,5,true),bad=[{...good,id:undefined},{...good,id:'bad',quantity:0},{...good,id:'not-included',included:false},{...good,id:'float',grams:1.5}],raw={version:1,title:'周末 & <bag>',limits:{grams:3000,ml:8000},items:[good,...bad,good]};assert(!validItem(bad[0]));const repaired=restore(raw);assert.equal(repaired.items.length,1);assert.equal(repaired.dropped,5);assert.equal(restore(raw,true),null);assert(restore({...raw,items:[good]},true));assert.equal(restore({...raw,items:[good],title:'字'.repeat(61)},true),null);assert.equal(restore({...raw,version:2}),null);for(const key of ['day','night','studio'])assert(template(key).every(validItem));
});

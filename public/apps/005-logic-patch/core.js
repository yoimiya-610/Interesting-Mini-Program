(function(root){
  'use strict';
  const NAMES=Object.freeze(['AND','OR','XOR','NAND','NOR','XNOR']);
  const INFO=Object.freeze({AND:'两路都为 1，才输出 1。',OR:'至少一路为 1，就输出 1。',XOR:'两路不同输出 1，相同输出 0。',NAND:'AND 的反相：两路都为 1 时输出 0。',NOR:'OR 的反相：两路都为 0 时输出 1。',XNOR:'XOR 的反相：两路相同输出 1。'});
  const PUZZLES=Object.freeze([
    {id:'all-on',name:'全亮才通',goal:'只有 A、B、C、D 全部为 1 时，输出才为 1。',gates:['AND','AND','AND'],hint:'先判断每一对是否都为 1，再合并两路结果。'},
    {id:'any-on',name:'任意一路',goal:'四个输入中，只要至少有一个为 1，输出就为 1。',gates:['OR','OR','OR'],hint:'每组先判断是否至少有一个 1。'},
    {id:'same-pairs',name:'两组都相同',goal:'A 与 B 相同，且 C 与 D 相同时，输出才为 1。',gates:['XNOR','XNOR','AND'],hint:'先判断每一组内部是否相同，再合并两个判断。'},
    {id:'odd-parity',name:'奇数个亮点',goal:'四个输入中，1 的数量为奇数时输出 1，否则输出 0。',gates:['XOR','XOR','XOR'],hint:'先汇总每一组的奇偶性，再汇总两路结果。'},
    {id:'not-all',name:'少一个也行',goal:'四个输入没有全部为 1 时输出 1；全部为 1 时输出 0。',gates:['NAND','NAND','OR'],hint:'让每组在「不全为 1」时发出 1，再合并。'},
    {id:'all-off',name:'全灭才通',goal:'只有四个输入全部为 0 时输出 1，其他情况输出 0。',gates:['OR','OR','NOR'],hint:'先检查每组有没有 1，再寻找两组都没亮的情况。'}
  ].map(p=>Object.freeze({...p,gates:Object.freeze(p.gates)})));
  const DEFAULT=Object.freeze(['AND','OR','XOR']);
  function validGates(types){return Array.isArray(types)&&types.length===3&&types.every(v=>NAMES.includes(v));}
  function validBits(bits){return Array.isArray(bits)&&bits.length===4&&bits.every(v=>v===0||v===1);}
  function gate(type,a,b){if(!NAMES.includes(type)||(a!==0&&a!==1)||(b!==0&&b!==1))throw new RangeError('Only known gates and binary 0/1 inputs are allowed');switch(type){case 'AND':return a&b;case 'OR':return a|b;case 'XOR':return a^b;case 'NAND':return 1-(a&b);case 'NOR':return 1-(a|b);case 'XNOR':return 1-(a^b);}}
  function evaluate(types,bits){if(!validGates(types)||!validBits(bits))throw new RangeError('Expected 3 gates and 4 binary inputs');const g1=gate(types[0],bits[0],bits[1]),g2=gate(types[1],bits[2],bits[3]);return {g1,g2,y:gate(types[2],g1,g2)};}
  function truthTable(types){if(!validGates(types))throw new RangeError('Invalid gates');return Array.from({length:16},(_,value)=>{const bits=Array.from({length:4},(_,i)=>(value>>(3-i))&1);return {bits,...evaluate(types,bits)};});}
  function compare(types,target){const actual=truthTable(types),expected=truthTable(target),mismatches=actual.flatMap((row,i)=>row.y===expected[i].y?[]:[{bits:[...row.bits],actual:row.y,expected:expected[i].y}]);return {matches:16-mismatches.length,total:16,mismatches};}
  function restore(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1)return null;const gates=validGates(raw.gates)?[...raw.gates]:[...DEFAULT],bits=validBits(raw.bits)?[...raw.bits]:[0,0,0,0],mode=['explore','challenge'].includes(raw.mode)?raw.mode:'explore',puzzle=PUZZLES.some(p=>p.id===raw.puzzle)?raw.puzzle:PUZZLES[0].id,completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(id=>PUZZLES.some(p=>p.id===id)))]:[];return {gates,bits,mode,puzzle,completed,repaired:!validGates(raw.gates)||!validBits(raw.bits)||mode!==raw.mode||puzzle!==raw.puzzle||!Array.isArray(raw.completed)||completed.length!==raw.completed.length};}
  root.LogicPatch=Object.freeze({NAMES,INFO,PUZZLES,DEFAULT,gate,evaluate,truthTable,compare,restore});
})(globalThis);

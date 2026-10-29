'use strict';
(() => {
  const get=id=>document.getElementById(id);
  let a=0,b=0;
  function render(){
    for(const [id,value]of [['primerA',a],['primerB',b]]){
      get(id).setAttribute('aria-pressed',String(Boolean(value)));
      get(id).textContent=(id==='primerA'?'A':'B')+' = '+value;
    }
    get('primerAnd').textContent=LogicPatch.gate('AND',a,b);
    get('primerOr').textContent=LogicPatch.gate('OR',a,b);
    get('primerNot').textContent=1-a;
    const sum=LogicPatch.gate('XOR',a,b),carry=LogicPatch.gate('AND',a,b);
    get('primerSum').textContent=sum;
    get('primerCarry').textContent=carry;
    get('primerAddition').textContent=a+' + '+b+' = '+carry+sum+'₂ = '+(a+b)+'₁₀';
  }
  get('primerA').onclick=()=>{a=1-a;render();};
  get('primerB').onclick=()=>{b=1-b;render();};
  get('logicPrimer').open=matchMedia('(min-width:901px)').matches;
  render();
})();

(function(root){
  'use strict';
  const COUNT=16,MAX_SLOTS=8,TAU=2*Math.PI;
  const rows=()=>Array.from({length:COUNT},()=>({amplitude:0,phase:0,on:true}));
  const PRESETS=[
    {id:'sine',name:['一根正弦','One sine'],lead:['只有基频，先认识振幅与相位。','Only the fundamental: meet amplitude and phase.'],task:['把第一路相位从 0° 改为 90°，峰值与 RMS 是否改变？','Change phase 1 from 0° to 90°. Do peak and RMS change?']},
    {id:'square',name:['方波的边缘','Square-wave edges'],lead:['八路奇次谐波，振幅按 1/n 衰减。','Eight odd harmonics with amplitudes falling as 1/n.'],task:['把最高阶从 1 提到 15，观察边缘振铃；有限项不会成为理想跳变。','Raise the cutoff from 1 to 15. Watch the edge ringing: finite terms cannot make an ideal jump.']},
    {id:'saw',name:['锯齿的斜坡','Sawtooth ramp'],lead:['十六路谐波，交替相位与 1/n 衰减。','Sixteen harmonics: alternating phases and a 1/n decay.'],task:['先保存参考，再关闭所有偶数路，比较斜坡与对称性。','Save a reference, then mute the even harmonics. Compare the ramp and symmetry.']},
    {id:'triangle',name:['三角的柔角','Gentle triangle'],lead:['奇次谐波按 1/n² 衰减，并交替反相。','Odd harmonics decay as 1/n² with alternating inversion.'],task:['与方波比较高阶振幅；缓慢变化的曲线需要同样多的高频吗？','Compare its upper amplitudes with the square wave. Does a smoother curve need as much high-frequency content?']},
    {id:'octaves',name:['八度阶梯','Octave ladder'],lead:['只留下第 1、2、4、8、16 路，听与看层次。','Keep only harmonics 1, 2, 4, 8, and 16. Look and listen to the layers.'],task:['用独奏逐路听，再恢复混合；这是合成示例，不是某件乐器的测量。','Solo each layer, then restore the mix. This is a synthesis example, not a measured instrument.']},
    {id:'pulse',name:['窄脉冲簇','Narrow pulse'],lead:['十六路同振幅、同余弦相位，在一点聚拢。','Sixteen equal-amplitude, cosine-phase components meet at one point.'],task:['逐步降低最高阶，观察尖峰如何变宽；信号均值仍为零。','Lower the cutoff gradually. Watch the peak widen; the signal still has zero mean.']},
    {id:'missing',name:['缺席的基频','Missing fundamental'],lead:['第 1 路为零，但第 2–5 路仍共享一个周期。','Harmonic 1 is zero, but harmonics 2–5 share a common period.'],task:['关闭第 3、5 路，只剩偶数路；重复周期发生了什么？','Mute harmonics 3 and 5, leaving only even harmonics. What happens to the repeat period?']},
    {id:'phase',name:['同谱异相','Same spectrum, new phase'],lead:['与锯齿相同的振幅谱，改用统一的 90° 相位。','The sawtooth amplitude spectrum, now with every phase at 90°.'],task:['保存锯齿作参考，再载入此例；频谱与 RMS 相同，形状却不同。','Save the sawtooth as a reference, then load this example. Spectrum and RMS match, but the shape changes.']}
  ];
  const copy=v=>JSON.parse(JSON.stringify(v));
  function preset(id){
    if(!PRESETS.some(p=>p.id===id))throw new RangeError('Unknown starting point');
    const c={preset:id,label:'',frequency:220,cutoff:16,cycles:2,showParts:true,rows:rows()};
    for(let n=1;n<=COUNT;n++){
      const r=c.rows[n-1];
      if(id==='sine')r.amplitude=n===1?1:0;
      if(id==='square')r.amplitude=n%2?1/n:0;
      if(id==='saw'){r.amplitude=1/n;r.phase=n%2?0:180;}
      if(id==='triangle'){r.amplitude=n%2?1/(n*n):0;r.phase=n%4===3?180:0;}
      if(id==='octaves')r.amplitude=({1:1,2:.6,4:.35,8:.18,16:.1})[n]||0;
      if(id==='pulse'){r.amplitude=.5;r.phase=90;}
      if(id==='missing')r.amplitude=({2:1,3:.7,4:.5,5:.3})[n]||0;
      if(id==='phase'){r.amplitude=1/n;r.phase=90;}
    }return c;
  }
  function valid(c){return !!c&&typeof c==='object'&&PRESETS.some(p=>p.id===c.preset)&&typeof c.label==='string'&&Array.from(c.label).length<=60&&Number.isInteger(c.frequency)&&c.frequency>=40&&c.frequency<=600&&Number.isInteger(c.cutoff)&&c.cutoff>=1&&c.cutoff<=COUNT&&[1,2,4].includes(c.cycles)&&typeof c.showParts==='boolean'&&Array.isArray(c.rows)&&c.rows.length===COUNT&&c.rows.every(r=>r&&Number.isFinite(r.amplitude)&&r.amplitude>=0&&r.amplitude<=1&&Number.isInteger(r.phase)&&r.phase>=-180&&r.phase<=180&&typeof r.on==='boolean');}
  function requireConfig(c){if(!valid(c))throw new RangeError('Invalid wave settings');}
  function amplitudes(c){requireConfig(c);return c.rows.map((r,i)=>r.on&&i<c.cutoff?r.amplitude:0);}
  function value(c,x){const a=amplitudes(c);return a.reduce((s,v,i)=>s+v*Math.sin(TAU*(i+1)*x+c.rows[i].phase*Math.PI/180),0);}
  function sample(c,count=1024,cycles=c.cycles){
    requireConfig(c);if(!Number.isInteger(count)||count<32||count>32768||!Number.isFinite(cycles)||cycles<=0||cycles>4)throw new RangeError('Invalid sample window');
    const a=amplitudes(c),out=new Float64Array(count+1);
    for(let j=0;j<=count;j++)for(let i=0;i<COUNT;i++)out[j]+=a[i]*Math.sin(TAU*(i+1)*cycles*j/count+c.rows[i].phase*Math.PI/180);
    return out;
  }
  function metrics(c){const a=amplitudes(c),values=sample(c,8192,1),peak=values.reduce((m,v)=>Math.max(m,Math.abs(v)),0);return {rms:Math.sqrt(a.reduce((s,v)=>s+v*v/2,0)),peak,bound:a.reduce((s,v)=>s+v,0),active:a.filter(v=>v>0).length,highest:a.reduce((n,v,i)=>v>0?i+1:n,0)*c.frequency};}
  function shapeDistance(a,b){requireConfig(a);requireConfig(b);const aa=amplitudes(a),bb=amplitudes(b);return Math.sqrt(Math.max(0,aa.reduce((s,v,i)=>s+(v*v+bb[i]*bb[i]-2*v*bb[i]*Math.cos((a.rows[i].phase-b.rows[i].phase)*Math.PI/180))/2,0)));}
  function restore(raw){
    if(!raw||raw.version!==1||!valid(raw.current)||!Array.isArray(raw.slots)||raw.slots.length>MAX_SLOTS)return null;
    const ids=new Set();for(const s of raw.slots){if(!s||typeof s.id!=='string'||!/^s[a-z0-9-]{1,50}$/.test(s.id)||ids.has(s.id)||!valid(s.config))return null;ids.add(s.id);}
    if(raw.reference!==null&&!ids.has(raw.reference))return null;
    const clean=c=>({preset:c.preset,label:c.label,frequency:c.frequency,cutoff:c.cutoff,cycles:c.cycles,showParts:c.showParts,rows:c.rows.map(r=>({amplitude:r.amplitude,phase:r.phase,on:r.on}))});
    return {version:1,current:clean(raw.current),slots:raw.slots.map(s=>({id:s.id,config:clean(s.config)})),reference:raw.reference};
  }
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function svg(c,reference=null,language='en',width=1000){
    requireConfig(c);if(reference)requireConfig(reference);
    if(!Number.isInteger(width)||width<240||width>1600)throw new RangeError('Invalid plot width');
    const height=width<500?310:390,left=65,span=width-90,mid=(65+height-75)/2,half=(height-140)/2,ticks=width<500?4:8;
    const total=sample(c),other=reference?sample(reference,1024,c.cycles):null;
    const max=Math.max(1,...total.map(Math.abs),...(other?other.map(Math.abs):[]))*1.08;
    const path=arr=>Array.from(arr,(v,i)=>(i?'L':'M')+(left+i/1024*span).toFixed(2)+','+(mid-v/max*half).toFixed(2)).join('');
    const title='009 · '+(language==='en'?'Wave Workshop':'波形工坊')+(c.label?' · '+c.label:'');
    const label=language==='en'?'Base cycles / relative amplitude':'基准周期 / 相对振幅';
    let parts='';if(c.showParts){const a=amplitudes(c);a.forEach((v,i)=>{if(v){const arr=Float64Array.from({length:1025},(_,j)=>v*Math.sin(TAU*(i+1)*c.cycles*j/1024+c.rows[i].phase*Math.PI/180));parts+='<path d="'+path(arr)+'"/>';}});}
    let grid='';for(let i=0;i<=ticks;i++){const x=left+i/ticks*span;grid+='<path stroke="#d5ddd6" d="M'+x+' 65V'+(height-75)+'"/><text x="'+x+'" y="'+(height-48)+'">'+(c.cycles*i/ticks)+'</text>';}
    for(let j=-1;j<=1;j++)grid+='<path stroke="#d5ddd6" d="M'+left+' '+(mid-j*half)+'H'+(width-25)+'"/><text x="55" y="'+(mid+5-j*half)+'" text-anchor="end">'+(j*max).toFixed(2)+'</text>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+escape(title+' / '+label)+'"><title>'+escape(title)+'</title><rect width="'+width+'" height="'+height+'" rx="14" fill="#fcfaf4"/><g fill="#475854" font-family="Arial,SimHei,sans-serif" font-size="16" text-anchor="middle"><text x="'+width/2+'" y="32">009 · '+(language==='en'?'Wave Workshop':'波形工坊')+'</text>'+grid+'<text x="'+width/2+'" y="'+(height-15)+'">'+label+'</text></g><g fill="none" stroke="#a6b6aa" stroke-width="1.1" opacity=".6">'+parts+'</g>'+(other?'<path d="'+path(other)+'" fill="none" stroke="#237b72" stroke-dasharray="8 5" stroke-width="2.4"/>':'')+'<path d="'+path(total)+'" fill="none" stroke="#7543a1" stroke-width="3"/></svg>';
  }
  function pcm(c,rate=24000,seconds=2){
    requireConfig(c);if(!Number.isInteger(rate)||rate<8000||rate>96000||!Number.isFinite(seconds)||seconds<=0||seconds>5||metrics(c).highest>=rate/2)throw new RangeError('Invalid audio sampling');
    const a=amplitudes(c),bound=a.reduce((s,v)=>s+v,0)||1,out=new Float32Array(Math.floor(rate*seconds));
    for(let j=0;j<out.length;j++){let y=0;for(let i=0;i<COUNT;i++)y+=a[i]*Math.sin(TAU*(i+1)*c.frequency*j/rate+c.rows[i].phase*Math.PI/180);const fade=Math.min(1,j/(rate*.01),(out.length-1-j)/(rate*.01));out[j]=y/bound*.18*fade;}
    return out;
  }
  function wav(c){const data=pcm(c),buffer=new ArrayBuffer(44+data.length*2),view=new DataView(buffer);const text=(at,s)=>Array.from(s).forEach((v,i)=>view.setUint8(at+i,v.charCodeAt(0)));text(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,24000,true);view.setUint32(28,48000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,data.length*2,true);data.forEach((v,i)=>view.setInt16(44+i*2,Math.round(v*32767),true));return buffer;}
  root.WaveWorkshop=Object.freeze({COUNT,MAX_SLOTS,PRESETS,copy,preset,valid,amplitudes,value,sample,metrics,shapeDistance,restore,svg,pcm,wav});
})(globalThis);

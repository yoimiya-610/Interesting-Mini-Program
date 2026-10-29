'use strict';
(() => {
  const FIELDS = [
    ['attract','指尖聚拢','Pull together','星尘向指针聚拢；松开后沿原速度滑行。','Pull particles toward the pointer; release to let them coast.'],
    ['repel','排斥涟漪','Push away','从中心向外推开星尘，试着画出一条空白走廊。','Push particles outward and try carving a corridor of empty space.'],
    ['orbit','环流','Circular flow','施加切向力，让粒子绕指针转动，而不是直接靠近。','Apply a sideways force so particles turn around the pointer.'],
    ['spiral','螺旋井','Spiral well','聚拢与环流叠加，让星尘盘旋着靠近中心。','Combine inward and sideways forces to form a spiral.'],
    ['dipole','双极拉扯','Two poles','指针吸引，画面对称位置排斥；移动指针改变两极间距。','Pull at the pointer and push at its opposite position; move to separate the poles.'],
    ['wave','行波','Traveling wave','水平推力与随时间移动的波浪叠加，拖动改变波纹位置。','Mix a horizontal push with a traveling wave; drag to shift its origin.'],
    ['rail','水平轨道','Horizontal rail','把星尘拉向指针所在的水平线，并沿线向右推进。','Gather particles onto the pointer’s horizontal line and move them right.'],
    ['ring','空心星环','Hollow ring','内侧向外推、外侧向内拉，在中心周围留出一圈空白。','Push outward inside a ring and pull inward outside it, leaving a hollow center.']
  ];
  function force(id, particle, pointer, width, height, time=0, strength=.65) {
    if (!FIELDS.some(field=>field[0]===id)) throw new RangeError('Unknown field');
    if (![particle.x,particle.y,pointer.x,pointer.y,width,height,time,strength].every(Number.isFinite)||width<=0||height<=0||strength<0) throw new RangeError('Invalid field input');
    const radial=(x,y)=>{const dx=x-particle.x,dy=y-particle.y,squared=dx*dx+dy*dy+900,distance=Math.sqrt(squared),magnitude=Math.min(.55,1800*strength/squared);return {x:dx/distance*magnitude,y:dy/distance*magnitude};};
    const pull=radial(pointer.x,pointer.y),dx=pointer.x-particle.x,dy=pointer.y-particle.y;
    switch(id){
      case 'attract': return pull;
      case 'repel': return {x:-pull.x,y:-pull.y};
      case 'orbit': return {x:-pull.y,y:pull.x};
      case 'spiral': return {x:.65*pull.x-.8*pull.y,y:.65*pull.y+.8*pull.x};
      case 'dipole': {const other=radial(width-pointer.x,height-pointer.y);return {x:pull.x-other.x,y:pull.y-other.y};}
      case 'wave': return {x:.035*strength,y:Math.sin((particle.x-pointer.x)/60-time*2)*.08*strength+Math.tanh(dy/100)*.015*strength};
      case 'rail': return {x:.06*strength,y:Math.tanh(dy/70)*.12*strength};
      case 'ring': {const distance=Math.hypot(dx,dy),radius=Math.min(width,height)*.22,scale=Math.tanh((distance-radius)/35);return {x:pull.x*scale,y:pull.y*scale};}
    }
  }
  globalThis.OrbitFields=Object.freeze({FIELDS,force});
  if(globalThis.ProgramEnglish)for(const [,zh,en,description,english]of FIELDS)Object.assign(globalThis.ProgramEnglish,{[zh]:en,[description]:english});
})();

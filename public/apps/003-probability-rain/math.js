(function(root){
  'use strict';
  function parameters(n,p){if(!Number.isInteger(n)||n<1||n>30||!Number.isFinite(p)||p<0||p>1)throw new RangeError('n must be an integer in [1,30]; p must be in [0,1]');}
  function distribution(n,p){parameters(n,p);if(p===0)return Array.from({length:n+1},(_,k)=>Number(k===0));if(p===1)return Array.from({length:n+1},(_,k)=>Number(k===n));let choose=1;return Array.from({length:n+1},(_,k)=>{if(k)choose=choose*(n-k+1)/k;return choose*Math.pow(p,k)*Math.pow(1-p,n-k);});}
  function samplePath(n,p,rng=Math.random){parameters(n,p);let rights=0;const steps=Array.from({length:n},()=>{const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('rng must return values in [0,1)');const right=value<p;if(right)rights++;return right;});return {steps,rights};}
  function summarize(counts){if(!Array.isArray(counts)||counts.length<2||!counts.every(c=>Number.isSafeInteger(c)&&c>=0))throw new RangeError('counts must contain nonnegative safe integers');const total=counts.reduce((a,b)=>a+b,0);if(!Number.isSafeInteger(total))throw new RangeError('total exceeds safe integer range');if(!total)return {total,mean:null,standardDeviation:null};const mean=counts.reduce((s,c,k)=>s+c*k,0)/total,variance=counts.reduce((s,c,k)=>s+c*(k-mean)**2,0)/total;return {total,mean,standardDeviation:Math.sqrt(variance)};}
  root.ProbabilityRain=Object.freeze({distribution,samplePath,summarize});
})(globalThis);

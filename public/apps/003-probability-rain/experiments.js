'use strict';
(() => {
  const EXPERIMENTS=[
    ['short','四次公平选择','Four fair choices',4,.5,'先猜中心槽与两端的差距，再比较 100 与 1100 颗的比例。','Predict the center-to-edge gap, then compare proportions at 100 and 1,100 marbles.'],
    ['balanced','八层钟形','Eight balanced rows',8,.5,'观察关于中间槽的对称性；实际左右两边不必恰好相等。','Look for symmetry about the center; the observed sides need not be exactly equal.'],
    ['wide','十二层展开','Twelve rows',12,.5,'与八层公平实验保存对照，比较均值和标准差如何改变。','Save a comparison with eight fair rows and compare the mean and standard deviation.'],
    ['left','偏向左侧','Leaning left',10,.2,'预测均值 2，观察最左槽是否一定出现得最多。','Predict a mean of 2 and see whether the leftmost bin is necessarily the most common.'],
    ['right','左右镜像','Mirror to the right',10,.8,'与 20% 向右的实验对照；均值相加为 10，形状互为镜像。','Compare with 20% right: the means add to 10 and the theoretical shapes mirror each other.'],
    ['rare','稀少的右转','Rare right turns',12,.05,'关注零次和一次右转，追加样本后检查少见槽位是否出现。','Watch zero and one right turn, then add samples and look for rare bins.'],
    ['zero','没有右转','No right turns',8,0,'所有弹珠都应落入槽 0；检查这是确定性边界。','Every marble should land in bin 0; check this deterministic boundary.'],
    ['certain','每次都右转','Always right',8,1,'所有弹珠都应落入槽 8；与零概率实验比较标准差。','Every marble should land in bin 8; compare its standard deviation with zero probability.']
  ];
  function snapshot(n,p,counts){
    const expected=ProbabilityRain.distribution(n,p);
    if(!Array.isArray(counts)||counts.length!==n+1)throw new RangeError('Invalid bins');
    const {total,mean,standardDeviation}=ProbabilityRain.summarize(counts);
    if(!total)throw new RangeError('Collect samples before saving');
    return {n,p,total,mean,standardDeviation,theoreticalMean:n*p,theoreticalDeviation:Math.sqrt(n*p*(1-p)),distance:counts.reduce((sum,count,k)=>sum+Math.abs(count/total-expected[k]),0)/2};
  }
  globalThis.RainExperiments=Object.freeze({EXPERIMENTS,snapshot});
  if(globalThis.ProgramEnglish)for(const [,zh,en,,,goal,english]of EXPERIMENTS)Object.assign(globalThis.ProgramEnglish,{[zh]:en,[goal]:english});
})();

'use strict';
// Rectangles are zero-based [column, row, width, height, value].
globalThis.HeatExperiments = [
  {
    id: 'spark', name: ['中央热斑', 'Central hot spot'], edge: 'sealed', rate: 20, probe: [6, 4],
    heat: [[6, 4, 1, 1, 100]],
    material: [],
    task: ['先走一步，测热斑中心和它的邻格。再走十二步，比较最高温度与全板平均值。', 'Step once and measure the centre and a neighbour. Advance twelve steps and compare the peak with the board mean.'],
  },
  {
    id: 'seam', name: ['冷热拼接', 'Warm–cold seam'], edge: 'sealed', rate: 20, probe: [6, 4],
    heat: [[0, 0, 7, 10, 80], [7, 0, 7, 10, 0]],
    material: [],
    task: ['找出最先变温的两列，确认远处第一步不动。记录边界两侧的温差如何缩小。', 'Find the first two columns to change. Check that distant tiles stay put on step one, then track the shrinking gap across the seam.'],
  },
  {
    id: 'blanket', name: ['慢导热夹层', 'Slow layer'], edge: 'sealed', rate: 20, probe: [7, 4],
    heat: [[0, 0, 6, 10, 80], [8, 0, 6, 10, 0]],
    material: [[6, 0, 2, 10, 'slow']],
    task: ['走十二步并保存快照。重置热板，用矩形画笔把夹层改成普通材料，再走十二步比较。', 'Run twelve steps and save a snapshot. Reset the board, repaint the slow strip with the rectangle brush, then compare after another twelve steps.'],
  },
  {
    id: 'gate', name: ['隔墙开口', 'Gap in the wall'], edge: 'sealed', rate: 20, probe: [8, 4],
    heat: [[0, 0, 6, 10, 80], [8, 0, 6, 10, 0]],
    material: [[7, 0, 1, 4, 'blocked'], [7, 6, 1, 4, 'blocked']],
    task: ['观察开口附近和隔墙末端右侧何处先升温。封上两格开口，再从初始状态比较。', 'Compare warming near the gap with warming at the far end of the wall. Restore the starting frame and close both gap tiles for a second run.'],
  },
  {
    id: 'rim', name: ['贴边热带', 'Warm rim'], edge: 'ambient', rate: 20, probe: [0, 0],
    heat: [[0, 0, 14, 10, 80]],
    material: [],
    task: ['先走一步，比较角落、边中和中心。切换为绝热边缘后重跑，观察全板平均值。', 'Step once and compare a corner, an edge midpoint, and the centre. Repeat with a sealed edge and compare the board mean.'],
  },
  {
    id: 'wrap', name: ['跨边相邻', 'Across the seam'], edge: 'wrap', rate: 20, probe: [13, 4],
    heat: [[0, 4, 1, 2, 100]],
    material: [],
    task: ['测量右边缘何时变温。恢复后改为绝热，检验对边在第一步是否仍有变化。', 'Measure when the right edge changes. Restore and switch to a sealed edge to test whether the far side still changes on step one.'],
  },
  {
    id: 'ring', name: ['热环冷芯', 'Warm ring, cold core'], edge: 'ambient', rate: 10, probe: [6, 4],
    heat: [[3, 2, 8, 6, 80], [5, 3, 4, 4, 0]],
    material: [],
    task: ['跟踪冷芯与外缘，看看何处先变暖。改成快档时，比较同样步数下的温差。', 'Track the cold core and the outer edge to see which warms first. Compare the temperature gap at the same step count with the faster exchange rate.'],
  },
  {
    id: 'bridge', name: ['跨越慢导热带', 'Bridge across a slow layer'], edge: 'sealed', rate: 20, probe: [9, 4],
    heat: [[0, 2, 3, 6, 100], [11, 2, 3, 6, 0]],
    material: [[5, 0, 4, 10, 'slow'], [5, 4, 4, 2, 'standard']],
    task: ['测普通材料桥口和旁边慢带。运行后存快照，重置热板，用慢材料补掉桥，再比较同一步数的差值图。', 'Measure the bridge exit and the slow strip beside it. Run and save a snapshot, reset the board, fill in the bridge with slow material, and compare at the same step count.'],
  },
];

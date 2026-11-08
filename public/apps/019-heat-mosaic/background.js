'use strict';
globalThis.ProgramBackground = {
  target: '.guide-anchor',
  position: 'append',
  accent: '#235f65',
  title: ['热量如何穿过一块板', 'How heat crosses a plate'],
  lead: ['温度描述冷热，导热描述能量在温差驱动下的传递。用同一块热板比较不同材料与边缘。', 'Temperature describes how hot or cold something is. Conduction is the transfer of energy driven by a temperature difference.'],
  sections: [
    {
      title: ['01 / 从传热实验到方程', '01 / From heat flow to an equation'],
      paragraphs: [
        ['约瑟夫·傅里叶在 1822 年出版的《热的解析理论》中系统研究固体内的热传导。热流方向由温度从高到低的变化决定，材料的导热能力也会影响流量。热流拼图用格子做离散近似。', 'Joseph Fourier studied conduction in solids in his 1822 Analytical Theory of Heat. Heat flows toward lower temperature, and thermal conductivity affects how much flows for a given temperature gradient. Heat Mosaic uses a discrete grid to illustrate those ideas.'],
        ['想象在桌上放一块受热的金属片。温差很大时，附近会明显变暖。导热较慢的夹层能延缓另一侧升温，建筑保温和电子散热分别利用了减缓与加快传热的效果。', 'Imagine a metal plate with one warm patch. Nearby areas warm as heat spreads. A low-conductivity layer slows warming on its far side. Building insulation slows transfer, while cooling hardware uses conduction to carry heat away from components.'],
      ],
      sources: [
        {label: 'Fourier · 1822 first edition (HKUST Library)', href: 'https://doi.org/10.14711/spcol/b458351'},
        {label: 'OpenStax · Heat transfer mechanisms', href: 'https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer'},
      ],
    },
    {
      title: ['02 / 用探针读第一步', '02 / Read the first step'],
      paragraphs: [
        ['打开中央热斑。初始中心为 100，四邻均为 20。快档下，中心向每个邻格传 16，所以一步后中心变为 36，四邻各为 36，斜角仍为 20。全板平均温度不变。', 'Start with Central hot spot. The centre begins at 100 and its four neighbours at 20. In the faster setting, the centre transfers 16 to each neighbour. After one step it is 36, each of its four neighbours is 36, and the diagonal tiles stay at 20. The board mean stays constant.'],
        ['绝热边缘挡住板外交换。环绕边缘让对边相邻，适合观察跨缝传播。固定环境边缘则让外侧和温度为 20 的环境交换，板内平均值可以改变。角落有两条向外的边。', 'Sealed edges prevent exchange with the outside. Wrap joins opposite edges so you can observe transfer across the seam. The reservoir edge exchanges with a fixed outside temperature of 20 and can change the board mean. Corners have two exposed sides.'],
      ],
      sources: [],
    },
    {
      title: ['03 / 比较与边界', '03 / What the model can tell you'],
      paragraphs: [
        ['每格热容量相同，每步只和上下左右相邻格交换。接缝按两侧导热系数的调和平均值计算，低导热一侧会压低传递量。隔断格保持自身温度但不交换，温度画笔可以直接改变任一格。', 'Tiles have equal heat capacity and exchange only with their four side neighbours. A seam uses the harmonic mean of the two conductance factors, so the slower material reduces the transfer. Blocked tiles retain their temperatures and exchange nothing. Painting can set any tile directly.'],
        ['要比较一种改动，先存下第一次结果，重置热板，再改边缘或材料并运行相同步数。差值图显示当前减去快照，探针会给出精确到两位小数的读数。色标超过 ±20 时饱和。', 'For a controlled comparison, save the first result, reset the board, change one factor, and run the same number of steps. The difference view shows current minus snapshot. The probe reports values to two decimal places. Colours saturate beyond ±20.'],
        ['格子、温度和步数是模型尺度。切换交换速度改变每一步的传递比例。模型只包含面内导热，实际的时间、尺寸、热容量差异、空气流动与辐射都超出这一模型的范围。', 'Temperatures, tile sizes and steps are in model units. Changing the exchange rate changes the fraction transferred per step. This model covers conduction in the plane. Real time, dimensions, varying heat capacities, air movement and radiation are outside its scope.'],
      ],
      sources: [],
    },
  ],
};

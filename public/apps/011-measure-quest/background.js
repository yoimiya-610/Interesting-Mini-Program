'use strict';
globalThis.ProgramBackground={
 target:'.reading',position:'append',accent:'#246f7d',
 title:['量水题，为什么考的是规划','Why measuring water becomes planning'],
 lead:['没有中途刻度，只有装满、倒空和倒到底。空位也能成为量尺。','Without intermediate marks, you have full, empty, and boundary-to-boundary pours. Empty space becomes a measure.'],
 sections:[
  {title:['01 / 先看一个例子','01 / Start with an example'],paragraphs:[
   ['A 容量 3、B 容量 5，从空开始：装满 B 得到 [0,5]；B 倒向 A，A 装满时停下，得到 [3,2]。倒出的量是“来源水量”和“去向空位”中的较小值，不是随意挑一个数。','With capacities A=3 and B=5, start empty. Fill B: [0,5]. Pour B into A until A is full: [3,2]. The transfer is the smaller of the source amount and destination space, rather than an arbitrary chosen quantity.']
  ],sources:[{label:'University of Michigan · Water Jug tutorial',href:'https://soar.eecs.umich.edu/tutorials/soar_tutorial/01/'}]},
  {title:['02 / 相关的数学与教学','02 / Related mathematics and teaching'],paragraphs:[
   ['Eric Lehman、F. Thomson Leighton 与 Albert R. Meyer 的 2015 年《Mathematics for Computer Science》用量水题讲解状态机与整除。这是相关教学作品，不是把整类量水谜题归为三位作者的发明。本作的十六关、管路与成绩规则是为游戏安排的设计。','Eric Lehman, F. Thomson Leighton, and Albert R. Meyer use jug puzzles to teach state machines and divisibility in their 2015 Mathematics for Computer Science. This is a related teaching work, not an invention claim for the whole puzzle family. This game’s sixteen boards, pipes, and record rules are its own design.']
  ],sources:[{label:'MIT · Mathematics for Computer Science (2015)',href:'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/mit6_042js15_textbook.pdf'}]},
  {title:['03 / 把变化画成一张图','03 / Turn changes into a graph'],paragraphs:[
   ['[4,1,3] 这样的数组叫一个状态，每个数字对应一个容器。合法操作连接两个状态；寻找答案就是寻找通往目标的路径。这种表示也用于规划、程序验证与自动求解。','A vector such as [4,1,3] is a state, with one number per vessel. Legal operations connect states; solving means finding a path to the goal. Such representations also support planning, program verification, and automatic solving.'],
   ['本作每个有效操作都算 1 步，因此提示使用广度优先搜索，一层一层找最少操作数。它不比较用时或真实耗水量。后段关要求同时保住多份目标，并利用受限管路制造中转空位。','Every effective action costs one move, so hints use breadth-first search, exploring layers for the fewest operations. This does not minimize elapsed time or real water use. Later boards require several portions together and transfer space through restricted pipes.']
  ],sources:[{label:'MIT 6.006 · Breadth-First Search',href:'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-13-breadth-first-search-bfs/'}]},
  {title:['04 / 为什么有些数得不到','04 / Why some amounts are impossible'],paragraphs:[
   ['最大公约数是同时整除两个容量的最大正整数。双容器从空开始、可无限补水排水且任意互倒时，目标须能装进至少一个容器，并是最大公约数的倍数。例如容量 4 和 6 的最大公约数是 2，不能量出 3。旁边的小试验只检查这套假设。','The greatest common divisor is the largest positive integer dividing both capacities. For two initially empty vessels with unlimited filling/draining and unrestricted pours, a target must fit a vessel and be a multiple of that divisor. Capacities 4 and 6 have gcd 2 and cannot measure 3. The separate experiment checks only these assumptions.']
  ],sources:[]},
  {title:['05 / 使用边界与探索方法','05 / Boundaries and exploration'],paragraphs:[
   ['闭合关的总量始终不变，管路还会限制可达状态；即使满足公约数条件，也不能直接推出这些关卡可解。每关要求所有容器同时满足目标，匹配数量可能先减少再增加。撤销、记录和按需提示帮助你比较不同路线。','Closed boards conserve their total, while pipes further restrict reachable states. A divisor condition alone does not establish reachability there. Every vessel must meet its target simultaneously; matches may decrease before increasing. Undo, logs, and optional hints help compare routes.'],
   ['容器按整数容量与精确倾倒建模，不含真实流体、误差或流速。图形显示各自容量的占比，不能只比较水面的高度。它适合练习状态、守恒与规划，不是实际计量仪器。','The model uses integer capacities and exact pours, omitting fluid behavior, error, and flow speed. Pictures show fractions of individual capacities, so equal water heights need not mean equal amounts. Use it to practice states, conservation, and planning, not as a measuring instrument.']
  ],sources:[]}
 ]
};

'use strict';
globalThis.ProgramBackground={
 target:'.reading',position:'append',accent:'#b84b35',
 title:['为什么有些等待会牵动全局','Why some waiting moves the finish'],
 lead:['依赖是“先做什么”，关键路径是决定最早完工的最长链。先从小展底稿试一次，再展开方法。','Dependencies say what comes first. A critical path is a longest chain setting the earliest finish. Try the exhibition, then read the method.'],
 sections:[
  {title:['01 / 从一件日常小事开始','01 / Start with an everyday example'],paragraphs:[
   ['煮饭前要洗米，摆桌却能同时进行。前置任务不是“更重要”，而是后续工作的开始条件。本台用任务作为节点，依赖表示“前项完成，后项才能开始”。','Rice must be washed before cooking, while setting the table can overlap. A predecessor is a starting condition, not a ranking of importance. Tasks are nodes here; dependencies mean finish before start.'],
   ['工时总和把所有任务相加，工期则允许独立支线并行。因此它适合讨论小展、刊物、制作或协作计划；不是一天的时间分配表。','Task-duration sum adds every task; elapsed project duration allows independent branches to overlap. Use this for an exhibition, publication, making project, or collaborative plan. It is not a daily time budget.']
  ],sources:[]},
  {title:['02 / 方法从哪里来','02 / Where the method comes from'],paragraphs:[
   ['关键路径法与 20 世纪 50 年代的工业项目规划研究有关。James E. Kelley Jr. 与 Morgan R. Walker 在 1959 年共同发表 Critical-path planning and scheduling，后来也共同回顾了发展过程；这并非所有排程思想的唯一源头。','CPM is associated with industrial project-planning research in the 1950s. James E. Kelley Jr. and Morgan R. Walker jointly published Critical-path planning and scheduling in 1959 and later described its development. This was not the sole origin of all scheduling ideas.'],
   ['Kelley 在 1961 年讨论了包含顺序、工时与成本的数学模型。本台只实现固定工时的顺序分析；底稿、试算与版本对照是本项目的探索界面，不复刻完整历史系统。','Kelley’s 1961 paper discusses a mathematical model with sequence, duration, and cost. This desk implements only fixed-duration sequencing. Templates, previews, and version comparisons are this project’s interface choices, not a reproduction of a complete historical system.']
  ],sources:[{label:'Kelley & Walker · 1959 paper',href:'https://doi.org/10.1145/1460299.1460318'},{label:'Kelley & Walker · A Personal History',href:'https://www.pmi.org/learning/library/2019/04/07/15/10/origins-cpm-personal-history-3762'},{label:'Kelley · Mathematical Basis (1961)',href:'https://pubsonline.informs.org/doi/10.1287/opre.9.3.296'}]},
  {title:['03 / 读懂早晚与时差','03 / Read early, late, and float'],paragraphs:[
   ['向前计算：最早开始 ES 是所有前置任务最早结束 EF 的最大值，EF = ES + 工时。向后从同一最短工期推算最晚结束 LF 与最晚开始 LS。总时差 = LS − ES；自由时差是推迟本项而不推迟任何后项最早开始的余量。','Forward: earliest start ES is the maximum predecessor earliest finish EF; EF = ES + duration. Work backward from the same minimum project finish for latest finish LF and latest start LS. Total float is LS − ES. Free float is delay without moving any successor’s earliest start.'],
   ['总时差为 0 的任务标为关键。可能有多条关键路径；路径数不等于关键任务数。最晚安排与最早安排完成同一网络，总时差并不能让相邻任务同时随意延迟。','Zero-total-float tasks are critical. Several critical paths can coexist; their count differs from the number of critical tasks. Early and late schedules finish the same network. Float does not allow adjacent tasks to be delayed independently without limit.']
  ],sources:[{label:'Carnegie Mellon · Fundamental Scheduling Procedures',href:'https://www.cmu.edu/cee/projects/PMbook/10_Fundamental_Scheduling_Procedures.html'}]},
  {title:['04 / 一个对照与模型边界','04 / A comparison and its limits'],paragraphs:[
   ['在社区小展中，T3 场地确认只需 3 单位，作品支线更长。保存版本，再把 T3 试算为 4，工期仍为 15；试算为 10，工期变为 17。看起来不关键的工作，延长足够多后也能成为瓶颈。','In Community exhibition, T3 venue confirmation takes 3 units while the artwork branch is longer. Save a version. Preview T3 at 4: finish stays 15. At 10: finish becomes 17. Work with float can become the bottleneck after a large enough delay.'],
   ['假设工时准确、资源充足且所有任务必做；不建模日历、人员、成本与随机风险。两项需要同一工具却没有依赖时，图可能安排它们同时进行。请补上合理顺序，或另用资源排程方法；试算只回答当前网络里的变化。','Durations are fixed, resources sufficient, and every task required. Calendars, staffing, costs, and random risks are omitted. Two tasks sharing a tool may overlap unless sequenced. Add a reasonable dependency or use resource scheduling; previews answer only for this network.']
  ],sources:[]}
 ]
};

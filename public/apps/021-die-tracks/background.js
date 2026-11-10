'use strict';
globalThis.ProgramBackground = {
  target: '.guide-anchor',
  position: 'append',
  accent: '#79502e',
  title: ['位置一样，朝向可以不同', 'Same square, different orientation'],
  lead: ['把骰子放在桌上，沿一条棱翻到旁边。走过一圈回到原位时，原来的顶面可能已经换到侧边。', 'Set a die on a table and tip it over an edge. A short loop can return the die to the same square with its original top on a side.'],
  sections: [
    {
      title: ['01 / 滚动立方体谜题', '01 / Rolling-cube puzzles'],
      paragraphs: [
        ['滚动立方体谜题有多种形式。马丁·加德纳的专栏推广过这类游戏。凯文·布钦、迈克·布钦、埃里克·德梅因等人在 2007 年的论文中研究了多种带标记的滚动谜题。本游戏的十六张地图和底面闸门规则是独立设计。', 'Rolling-cube puzzles have several forms. Martin Gardner popularized examples in his column. Kevin Buchin, Maike Buchin, Erik Demaine and their coauthors studied variants with labelled tiles in a 2007 paper. These sixteen maps and the bottom-face gate rule were designed for this game.'],
      ],
      sources: [{label: 'Buchin et al. · On Rolling Cube Puzzles (2007)', href: 'https://erikdemaine.org/papers/DiceRolling_CCCG2007/'}],
    },
    {
      title: ['02 / 底面进门，顶面抵达', '02 / Bottom to enter, top to finish'],
      paragraphs: [
        ['初始顶面是 1，东面是 4。向右滚动一格后，东面变成新的底面，所以能进入 4 号地砖。每个数字都检查滚完后的底面。终点另外检查顶面，顶面不合时可以离开再回来。', 'The die begins with 1 on top and 4 facing east. One roll east puts 4 underneath, so it can enter a tile marked 4. Each number checks the bottom after the roll. The goal checks the top separately. You can leave and return if the top is wrong.'],
        ['沿一个正方形依次向东、南、西、北滚，位置会回到原点，但朝向会变。这可以用桌上的实体骰子试一试。', 'Roll east, south, west, then north around a square. The position returns to the start, while the orientation changes. Try it with a physical die on a table.'],
      ],
      sources: [{label: 'Erik and Martin Demaine · Dice Rolling: The Movie', href: 'https://erikdemaine.org/film/dicerolling/'}],
    },
    {
      title: ['03 / 怎样规划，以及模型边界', '03 / Planning and the model'],
      paragraphs: [
        ['可以用来练习空间旋转和倒推。先看终点需要哪一面朝上，再观察最后几格要求的底面。路线搜索把格子与骰子朝向一起当作状态，最短滚动数按这些状态计算。', 'Practice spatial rotation and working backward. Start with the goal’s top face and then inspect the bottom requirements on the final tiles. Route search tracks both the square and the die’s orientation. Shortest roll counts use those combined states.'],
        ['骰子只做沿棱的四分之一转，一次移动一格，没有滑动、跳跃、随机投掷或计时限制。提示只给当前局面的下一步，使用提示后的完成记录单独保存。', 'Each move is a quarter turn over one edge and advances one square. The game has no sliding, jumping, random throws, or timer. A hint gives one next roll from the current position, and runs with hints have separate records.'],
      ],
      sources: [],
    },
  ],
};

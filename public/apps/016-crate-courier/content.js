'use strict';
// Original boards; goal positions and routes are independently checked in tests.
globalThis.CrateLevels=[
  {
    "id": "01",
    "name": [
      "第一枚邮戳",
      "First postmark"
    ],
    "focus": [
      "走到箱子后面，向右推一次。",
      "Stand behind the crate and push right once."
    ],
    "chapter": [
      "入门投递",
      "FIRST ROUTES"
    ],
    "map": [
      "#######",
      "#     #",
      "# @$. #",
      "#     #",
      "#######"
    ],
    "minPush": 1
  },
  {
    "id": "02",
    "name": [
      "换到另一侧",
      "Change sides"
    ],
    "focus": [
      "推箱前先安排自己的站位。箱子不会跟着你转弯。",
      "Plan your standing position before each push. Crates do not turn with you."
    ],
    "chapter": [
      "入门投递",
      "FIRST ROUTES"
    ],
    "map": [
      "#######",
      "#   . #",
      "#     #",
      "# $@  #",
      "#     #",
      "#######"
    ],
    "minPush": 4
  },
  {
    "id": "03",
    "name": [
      "双件投递",
      "Two parcels"
    ],
    "focus": [
      "把两个箱子的路线分开考虑，留出绕行空间。",
      "Consider both routes and preserve room to walk around."
    ],
    "chapter": [
      "入门投递",
      "FIRST ROUTES"
    ],
    "map": [
      "#######",
      "#     #",
      "#  .  #",
      "#    ##",
      "# $.$@#",
      "#   # #",
      "#######"
    ],
    "minPush": 4
  },
  {
    "id": "04",
    "name": [
      "上下分流",
      "Split delivery"
    ],
    "focus": [
      "先检查每个箱子能够靠近终点的方向。",
      "Check the direction from which each crate can approach its goal."
    ],
    "chapter": [
      "入门投递",
      "FIRST ROUTES"
    ],
    "map": [
      "########",
      "# #  . #",
      "#   #  #",
      "#   $@ #",
      "#   $  #",
      "#   . ##",
      "########"
    ],
    "minPush": 4
  },
  {
    "id": "05",
    "name": [
      "侧边信道",
      "Side passage"
    ],
    "focus": [
      "墙边能走人，不代表箱子还能从那里转向。",
      "A passage may admit a person without letting a crate turn."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "########",
      "#      #",
      "#   .###",
      "#    $@#",
      "#   ## #",
      "#    $.#",
      "########"
    ],
    "minPush": 5
  },
  {
    "id": "06",
    "name": [
      "先到的包裹",
      "Early arrival"
    ],
    "focus": [
      "已经归位的箱子也可能挡路。观察另一个箱子的站位需求。",
      "A crate already on a goal may block a route. Check where you must stand for the other crate."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "########",
      "##    ##",
      "#@$ *  #",
      "##     #",
      "#    . #",
      "#      #",
      "########"
    ],
    "minPush": 5
  },
  {
    "id": "07",
    "name": [
      "隔墙绕行",
      "Around the partition"
    ],
    "focus": [
      "把行走路线和推箱路线分别规划。",
      "Plan walking routes separately from crate routes."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "#######",
      "# #@ ##",
      "#  $$##",
      "#     #",
      "# .   #",
      "# # . #",
      "#######"
    ],
    "minPush": 6
  },
  {
    "id": "08",
    "name": [
      "错误的捷径",
      "False shortcut"
    ],
    "focus": [
      "看似合法的一推可能堵住另一个箱子的道路。可以放心撤销。",
      "A legal push may block the other crate’s route. Undo is always available."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "########",
      "#  # @ #",
      "#  $.$ #",
      "#   # ##",
      "#   #  #",
      "#  .   #",
      "########"
    ],
    "minPush": 6
  },
  {
    "id": "09",
    "name": [
      "穿过窄口",
      "Through the slot"
    ],
    "focus": [
      "终点旁的墙决定最后一次推箱应从哪边开始。",
      "Walls beside a goal determine the side needed for the final push."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "########",
      "# #@####",
      "# .$   #",
      "# #    #",
      "#    $##",
      "# #.   #",
      "########"
    ],
    "minPush": 8
  },
  {
    "id": "10",
    "name": [
      "让出旧位置",
      "Make room again"
    ],
    "focus": [
      "不要把终点当锁扣：先归位的箱子可能需要再离开。",
      "Goals are not locks: an early arrival may need to leave again."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "#######",
      "#@ #  #",
      "#$ #$ #",
      "# #   #",
      "#.    #",
      "#.#  ##",
      "#######"
    ],
    "minPush": 8
  },
  {
    "id": "11",
    "name": [
      "两段转运",
      "Two transfers"
    ],
    "focus": [
      "绕过隔墙时，给自己保留站到箱子背后的通道。",
      "Keep access to the back of each crate while routing around the partition."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "########",
      "###    #",
      "##@$   #",
      "# $#. .#",
      "#      #",
      "#     ##",
      "########"
    ],
    "minPush": 8
  },
  {
    "id": "12",
    "name": [
      "分隔月台",
      "Divided platform"
    ],
    "focus": [
      "多个入口并不意味着两只箱子可以随意交换顺序。",
      "Multiple entrances do not make the two crates interchangeable in order."
    ],
    "chapter": [
      "转运练习",
      "TRANSFERS"
    ],
    "map": [
      "#######",
      "# .   #",
      "# @#  #",
      "##$$ ##",
      "#    ##",
      "#    .#",
      "#######"
    ],
    "minPush": 8
  },
  {
    "id": "13",
    "name": [
      "三件会车",
      "Three-way traffic"
    ],
    "focus": [
      "规划临时停放位置，再决定谁先穿过中间通道。",
      "Choose temporary parking before deciding which crate crosses the middle first."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "########",
      "# #    #",
      "# $ # .#",
      "# #   .#",
      "# $.$  #",
      "#   @  #",
      "########"
    ],
    "minPush": 12
  },
  {
    "id": "14",
    "name": [
      "窄廊调度",
      "Corridor dispatch"
    ],
    "focus": [
      "三只箱子共享有限通道，最后一只不能被前两只封住。",
      "Three crates share limited passages. Do not seal the last one behind the others."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "#######",
      "#  @ ##",
      "##$$$ #",
      "#   # #",
      "# . ..#",
      "#     #",
      "#######"
    ],
    "minPush": 12
  },
  {
    "id": "15",
    "name": [
      "四件换位",
      "Four-crate exchange"
    ],
    "focus": [
      "终点会占用转身与通行空间；需要暂时撤回至少一只归位箱子。",
      "Goals consume maneuvering space. At least one placed crate must be moved away again."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "########",
      "#  @   #",
      "# $* $ #",
      "#     ##",
      "# #$.# #",
      "#    ..#",
      "########"
    ],
    "minPush": 13
  },
  {
    "id": "16",
    "name": [
      "邮戳不是锁",
      "Goals are not locks"
    ],
    "focus": [
      "既要安排送达次序，也要给自己留下返回箱子另一侧的道路。",
      "Plan delivery order and preserve a route back to the opposite side of each crate."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "########",
      "#.. . ##",
      "#  $ *@#",
      "#  # $ #",
      "#  $ # #",
      "#     ##",
      "########"
    ],
    "minPush": 12
  },
  {
    "id": "17",
    "name": [
      "末端装卸",
      "End-bay loading"
    ],
    "focus": [
      "四只箱子争用末端空间；先规划后面的装卸站位。",
      "Four crates compete for end-bay space. Plan the standing positions needed later."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "########",
      "#      #",
      "#  $ .$#",
      "##  # .#",
      "# $  #.#",
      "#@$   .#",
      "########"
    ],
    "minPush": 15
  },
  {
    "id": "18",
    "name": [
      "三格月台",
      "Three-slot platform"
    ],
    "focus": [
      "上方终点很诱人，但还要为剩余包裹保留接近路线。",
      "The top goals are tempting, but later parcels still need approach routes."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "#######",
      "#  ...#",
      "#     #",
      "#  $  #",
      "# $@$ #",
      "#  ## #",
      "#######"
    ],
    "minPush": 15
  },
  {
    "id": "19",
    "name": [
      "已到还要离开",
      "Delivered, then displaced"
    ],
    "focus": [
      "已归位的箱子必须再次让路，先看清上下区域之间的依赖。",
      "A placed crate must move again. Trace dependencies between the upper and lower areas."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "########",
      "#  .   #",
      "# $. $ #",
      "### #$ #",
      "# ##   #",
      "#@*.   #",
      "########"
    ],
    "minPush": 16
  },
  {
    "id": "20",
    "name": [
      "最后一班邮车",
      "Last collection"
    ],
    "focus": [
      "三只箱子共享左侧终点入口，临时停放与绕行顺序同样重要。",
      "Three crates share approaches to the left-hand goals. Temporary parking and walking order both matter."
    ],
    "chapter": [
      "调度挑战",
      "DISPATCH"
    ],
    "map": [
      "########",
      "# .    #",
      "#.   $ #",
      "# # $@##",
      "#.#  $ #",
      "# #    #",
      "########"
    ],
    "minPush": 16
  }
];

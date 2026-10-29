'use strict';
globalThis.ProgramBackground={
  "target": ".layout > aside",
  "position": "append",
  "accent": "#b6f1ed",
  "title": [
    "镜片为什么能让光转弯？",
    "Why does a mirror turn the beam?"
  ],
  "lead": [
    "名字里的「折光」是小径的意象；棋盘上的镜片使用反射规则。后段的联动则是一种规划谜题。",
    "The name suggests a winding light path; the board’s mirrors use reflection rules. Later linked controls add a planning puzzle."
  ],
  "sections": [
    {
      "title": [
        "01 / 反射与折射不是一回事",
        "01 / Reflection is not refraction"
      ],
      "paragraphs": [
        [
          "反射是光在界面处返回；折射是光穿过介质界面时传播方向改变。本棋盘只用理想镜面反射：入射角等于反射角，两角都相对垂直镜面的「法线」测量。",
          "Reflection returns light from an interface; refraction changes its direction as it passes between media. This board uses ideal mirror reflection: incidence and reflection angles are equal, measured from the line perpendicular to the surface—the normal."
        ],
        [
          "真实镜片可以有任意角度；这里把光限制为上下左右四个方向，把镜面限制为两种 45° 斜线。例如向右的光碰到 / 镜片后向上走。它适合观察路径，不是完整的光学仪器。",
          "Real mirrors can take many angles. Here light travels only up/down/left/right and mirrors have two 45° orientations. A rightward ray striking / turns upward. This is a path model rather than a complete optical instrument."
        ]
      ],
      "sources": [
        {
          "label": "OpenStax · The law of reflection",
          "href": "https://openstax.org/books/college-physics/pages/25-2-the-law-of-reflection"
        }
      ]
    },
    {
      "title": [
        "02 / 从光路走到联动规划",
        "02 / From ray paths to linked planning"
      ],
      "paragraphs": [
        [
          "独立关里，先设想终点前一面镜片要朝哪里，再沿路倒推。联动关中，一个按钮会翻转多块镜片：同一镜片被翻转两次会还原，所以要看整组影响，而不只是刚刚亮起的一段。联动是游戏机关，不是光的物理效应。",
          "For independent mirrors, work backward from the last turn before the goal. A linked button flips several mirrors: two flips restore an orientation, so consider the whole affected group rather than only the segment just lit. Coupling is a game mechanism, not an optical effect."
        ],
        [
          "例如按钮 A 同时翻 A、B，按钮 B 同时翻 B、C；各按一次后，B 被翻两次而还原，A、C 各改变一次。这个小例子说明，局部看似退步的操作也可能是整体方案的一部分。",
          "If button A flips A and B, and button B flips B and C, pressing each once restores B while changing A and C. An action that appears to undo local progress may still belong to a valid overall plan."
        ]
      ],
      "sources": []
    },
    {
      "title": [
        "03 / 这类谜题练习什么",
        "03 / What the puzzle practices"
      ],
      "paragraphs": [
        [
          "它把几何路径与状态规划放在一起：先检查是否经过全部星光，再考虑怎样用有限操作到达目标状态。撤销允许比较不同方案；通关并不意味着真实光路在相同材料与尺寸下也能实现。",
          "It combines geometric routing with state planning: find a route through every star, then reach the required mirror state within a move budget. Undo lets you compare plans. A solved board does not validate a real instrument’s materials or dimensions."
        ]
      ],
      "sources": []
    }
  ]
};

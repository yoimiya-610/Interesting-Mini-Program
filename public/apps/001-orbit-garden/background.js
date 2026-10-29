'use strict';
globalThis.ProgramBackground={
  "target": ".layout > aside",
  "position": "append",
  "accent": "#c6ef9b",
  "title": [
    "这些轨迹从哪里来？",
    "Where do these trails come from?"
  ],
  "lead": [
    "力改变速度；这里用人为设计的力场画轨迹，不模拟真实星系。",
    "Force changes velocity; this playground uses invented fields to draw trails rather than simulate real galaxies."
  ],
  "sections": [
    {
      "title": [
        "01 / 引力与转弯",
        "01 / Gravity and turning"
      ],
      "paragraphs": [
        [
          "牛顿的万有引力定律把吸引力与两个物体的质量、距离联系起来：质量不变时，距离加倍，力会变为原来的四分之一。引力指向另一个物体，不是把速度直接改成朝向它。",
          "Newton's law of gravitation relates attraction to mass and distance: with fixed masses, doubling the distance reduces the force to one quarter. Gravity points toward the other body; it does not instantly point the body's velocity at it."
        ],
        [
          "因此，有横向速度的物体会一边向前走，一边不断转弯。用这个角度观察星尘，比把它想成被鼠标直接拖走更接近本程序的操作。",
          "An object with sideways velocity can keep moving forward while its path bends. Thinking this way is more useful here than imagining that the pointer directly drags every particle."
        ]
      ],
      "sources": [
        {
          "label": "NASA · Gravity",
          "href": "https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/weight-gravitational-force/"
        }
      ]
    },
    {
      "title": [
        "02 / 为什么不同力场画出不同形状",
        "02 / Why the fields draw different shapes"
      ],
      "paragraphs": [
        [
          "聚拢场把加速度指向指针，排斥场反向推开；环流场施加侧向力，螺旋场把侧向与向内的作用叠加。空心星环在圈内向外推、圈外向内拉，围出一条环带。",
          "Pull points acceleration toward the pointer; repulsion points it away. Circular flow applies a sideways force, while the spiral mixes sideways and inward effects. The hollow ring pushes outward inside its radius and inward outside it."
        ],
        [
          "试一个对照：保持强度相同，先用聚拢场按住中心，再换成排斥场。观察空白区域、轨迹弯曲方向和松手后的运动，而不只比较颜色。",
          "Try a comparison: keep the same strength and hold the center using Pull, then switch to Push away. Watch empty regions, turning directions, and motion after release rather than just the colors."
        ]
      ],
      "sources": []
    },
    {
      "title": [
        "03 / 能学到什么，哪些地方是艺术规则",
        "03 / What this teaches, and what is artistic"
      ],
      "paragraphs": [
        [
          "它适合建立「位置—速度—加速度」的直觉，也可以用来画动态纹理。本程序加入了缓冲、限速、边缘反弹和人为设计的力场；没有真实天体的质量、距离单位，也没有完整的天体间相互引力，不能据此判断真实轨道。",
          "Use it to develop intuition about position, velocity, and acceleration, or to draw moving textures. The playground adds softened forces, speed limits, edge bounces, and invented fields. It has no physical mass/distance units or complete mutual gravity, so these trails do not establish real orbital behavior."
        ]
      ],
      "sources": []
    }
  ]
};

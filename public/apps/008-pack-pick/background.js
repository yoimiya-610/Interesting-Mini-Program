'use strict';
globalThis.ProgramBackground={
  "target": ".planner",
  "position": "append",
  "accent": "#a74628",
  "title": [
    "把行李看成一个取舍问题",
    "Packing as a problem of trade-offs"
  ],
  "lead": [
    "在重量与空间限制下挑选组合，同时保留必带物品。",
    "Choose valuable item groups under weight and space limits, while keeping essentials."
  ],
  "sections": [
    {
      "title": [
        "01 / 背包问题是什么",
        "01 / What is a knapsack problem?"
      ],
      "paragraphs": [
        [
          "给物品设置成本与价值，在容量内选出总价值尽可能高的一组，是经典背包问题的基本形式。它用于资源分配与组合选择，不只是旅行。本程序使用重量、空间两项约束，并把每一行视为不可拆分的一组。",
          "A basic knapsack problem assigns costs and values to items and selects a maximum-value subset within capacity. It appears in resource allocation as well as travel. This app uses two capacity constraints—weight and volume—and treats each row as an indivisible group."
        ],
        [
          "这属于组合优化：比较有限的选择组合。作为相关早期研究，George B. Dantzig 在 1957 年的《Discrete-Variable Extremum Problems》中讨论了用线性规划等方法处理离散变量优化；这并不是把旅行打包法归于他。本页的双容量、必带标记和整组重要度是本程序的设计选择。",
          "This belongs to combinatorial optimization: comparing finite combinations of choices. As related early research, George B. Dantzig's 1957 paper Discrete-Variable Extremum Problems discussed linear-programming and other approaches to discrete optimization. This does not credit him with inventing a travel-packing method. This app's two limits, essential marks, and group-priority interface are its own design choices."
        ]
      ],
      "sources": [
        {
          "label": "Google OR-Tools · Knapsack",
          "href": "https://developers.google.com/optimization/pack/knapsack"
        },
        {
          "label": "G. B. Dantzig · Discrete-Variable Extremum Problems (1957)",
          "href": "https://doi.org/10.1287/opre.5.2.266"
        }
      ]
    },
    {
      "title": [
        "02 / 建议怎样比较组合",
        "02 / How suggestions compare choices"
      ],
      "paragraphs": [
        [
          "先保留必带，再在双容量内比较可选组合的整行重要度总分。同分时依次选择更轻、更省空间的组合。一行数量增加会增加成本，但不会把该行的重要度重复累加；它表达的是整组带或不带的取舍。",
          "Essentials stay. Optional combinations are compared by the sum of row priorities under both limits. Ties favor lower weight, then lower volume. Increasing quantity increases a row’s cost but does not multiply its priority: the decision is whether to bring that whole group."
        ],
        [
          "例如还剩 1 kg、2 L：重要度 5 的物品占 900 g、1.9 L；另两组各重要度 3、占 400 g、0.8 L。第二种组合总分 6 且不超额，可能比单独最高分物品更合适。这说明逐件贪心挑选不一定最好。",
          "Suppose 1 kg and 2 L remain. One priority-5 item costs 900 g and 1.9 L; two priority-3 groups each cost 400 g and 0.8 L. Together the latter score 6 within both limits. Taking the highest-priority item first need not produce the best combination."
        ]
      ],
      "sources": []
    },
    {
      "title": [
        "03 / 数学建议与真实打包",
        "03 / A suggestion versus a real bag"
      ],
      "paragraphs": [
        [
          "重要度由你设定，所以建议反映你的打分，不是客观的必需品清单。这里只相加总重量与总体积，不处理形状、能否叠放、天气或个人需求；生成后先看预览，再决定是否采用。打包勾选只记录进度，不释放容量。",
          "Priorities are yours, so suggestions reflect your scoring rather than an objective essentials list. The model adds weight and volume; it does not model shapes, stacking, weather, or personal needs. Review a proposal before applying it. Packed marks track progress without freeing capacity."
        ]
      ],
      "sources": []
    }
  ]
};

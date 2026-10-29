'use strict';
globalThis.ProgramBackground={
  "target": ".layout > aside",
  "position": "prepend",
  "accent": "#234fc1",
  "title": [
    "从弹珠到钟形曲线",
    "From marbles to a bell curve"
  ],
  "lead": [
    "这里直接计算的是离散的二项分布；它在合适条件下可以接近连续的正态分布。多投弹珠与增加层数，改变的是两件不同的事。",
    "This program directly computes a discrete binomial distribution. Under suitable conditions it can resemble a continuous normal distribution. Dropping more marbles and adding more rows do different things."
  ],
  "sections": [
    {
      "title": [
        "01 / 一个落槽位置，是多次选择的总和",
        "01 / A bin is a sum of choices"
      ],
      "paragraphs": [
        [
          "一颗弹珠在 n 层各作一次独立选择，每次向右的概率是 p。它向右 k 次，就进入第 k 个槽；因此 K 是计数，只有 0 到 n 这些整数结果。这就是二项分布 B(n,p)。均值为 np，标准差为 √[np(1−p)]。",
          "A marble makes n independent choices with a fixed chance p of turning right. After k right turns it lands in bin k. K is a count with integer outcomes 0 through n: the binomial distribution B(n,p). Its mean is np and its standard deviation is √[np(1−p)]."
        ],
        [
          "例如 n = 8、p = 0.5，理论平均落在槽 4；平均值不代表每颗都落在那里。增加投珠数量会让比例通常更稳定，但不会把这一轮的 n 或 p 改掉。",
          "For n = 8 and p = 0.5, the theoretical mean is bin 4; individual marbles need not land there. More marbles generally make proportions steadier, but they do not change this run’s n or p."
        ]
      ],
      "sources": [
        {
          "label": "NIST · Binomial distribution",
          "href": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm"
        }
      ]
    },
    {
      "title": [
        "02 / 那正态分布是什么？",
        "02 / What is a normal distribution?"
      ],
      "paragraphs": [
        [
          "正态分布是一族对称的钟形连续分布：均值 μ 决定中心，标准差 σ 决定宽窄。曲线高度是概率密度，一段区间下的面积才对应概率；它不是每一个整数槽位的概率柱。",
          "A normal distribution is a symmetric, continuous bell-shaped family. The mean μ sets its center and standard deviation σ sets its spread. Curve height is probability density; area over an interval gives probability. It is different from an integer bin’s probability bar."
        ],
        [
          "当 n 足够大，而且 np 与 n(1−p) 都不太小时，二项分布常可用均值 np、标准差 √[np(1−p)] 的正态分布近似。这里最多十二层，近似并非总是良好，极偏的概率尤其要小心。蓝色理论线始终连接精确二项概率，不是新绘制的正态密度。",
          "With sufficiently large n and neither np nor n(1−p) too small, a normal distribution with mean np and standard deviation √[np(1−p)] often approximates the binomial. With at most twelve rows here, that approximation can be poor, especially for extreme p. The blue line always joins exact binomial probabilities; it is not a normal-density overlay."
        ]
      ],
      "sources": [
        {
          "label": "NIST · Normal distribution",
          "href": "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm"
        },
        {
          "label": "Penn State · Normal approximation",
          "href": "https://online.stat.psu.edu/stat414/lesson/28/28.1"
        }
      ]
    },
    {
      "title": [
        "03 / 这个联系从哪里来？",
        "03 / Where did the connection come from?"
      ],
      "paragraphs": [
        [
          "棣莫弗在 1733 年研究二项概率的近似时推导出正态曲线的重要早期形式。它后来也被称为高斯分布，但这不是一位研究者独自完成的历史。这里从弹珠的左右选择出发，重现的是问题的直觉，而不是历史实验的物理装置。",
          "Abraham de Moivre derived an important early normal-curve approximation to binomial probabilities in 1733. The distribution later also became known as Gaussian, but its history is not the work of just one person. The left/right model illustrates the probabilistic idea rather than recreating a historical physical apparatus."
        ]
      ],
      "sources": [
        {
          "label": "University of St Andrews · De Moivre",
          "href": "https://mathshistory.st-andrews.ac.uk/Biographies/De_Moivre/"
        }
      ]
    },
    {
      "title": [
        "04 / 怎么用这个实验学习",
        "04 / A useful comparison"
      ],
      "paragraphs": [
        [
          "先保存八层、50% 的结果，再保存十二层、50% 的结果，比较中心与宽度；然后试 5% 的稀少右转，观察偏斜。投珠数量控制的是样本多少，层数控制的是每颗珠子的试验次数。不要把「样本多」误解成「任何分布都会变正态」。",
          "Save eight rows at 50%, then twelve rows at 50%, and compare center and spread. Try rare 5% right turns to see skewness. Marble count controls sample size; rows control trials per marble. A large sample does not make every distribution normal."
        ],
        [
          "这种模型可帮助理解固定次数、独立且成功概率相同的计数问题。现实中若每次概率不同或选择相关，就不能直接照搬这个模型；本画面也不模拟真实弹珠的碰撞。",
          "This model helps with counts from a fixed number of independent trials sharing one success probability. If probabilities vary or choices are dependent, this binomial model need not apply. The animation also does not simulate real collisions."
        ]
      ],
      "sources": []
    }
  ]
};

'use strict';
globalThis.ProgramBackground = {
  target: '.guide-anchor',
  position: 'append',
  accent: '#154a3c',
  title: ['从货架单价到实际付款', 'From shelf labels to checkout'],
  lead: [
    '把同类商品换算到同一数量，再考虑必须整包购买的现实。',
    'Put comparable products on a common scale, then account for buying whole packs.',
  ],
  sections: [
    {
      title: ['01 / 同一把尺', '01 / A common scale'],
      paragraphs: [
        ['单价是总价除以数量，再乘以选定的比较单位。例如 ¥6 买 300 g，折合每 100 g ¥2。商品规格不同，也能在同一尺度上比较。', 'Divide the pack price by its quantity and multiply by the chosen reference amount. A 300 g pack for ¥6 costs ¥2 per 100 g. That puts different pack sizes on a common scale.'],
        ['单价标签是零售和计量领域逐步形成的做法。美国国家标准与技术研究院的《单价指南》汇集了常见标签和统一单位的建议，英国竞争与市场管理局也用超市样本研究不同规格的单价。这里的购物篮规划是本程序自己的教学设计。', 'Unit labels grew out of retail and measurement practice. The US National Institute of Standards and Technology collects labeling examples and guidance on consistent units. The UK Competition and Markets Authority studied unit prices across supermarket pack sizes. The basket planner here is this app’s teaching design.'],
      ],
      sources: [
        {label: 'NIST SP 1181 · Unit Pricing Guide', href: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/1181e2025/NIST.SP.1181e2025.html'},
        {label: 'CMA · Unit pricing research', href: 'https://www.gov.uk/government/publications/unit-pricing-analysis-and-consumer-research/summary-of-consumer-research-and-unit-pricing-analysis'},
      ],
    },
    {
      title: ['02 / 一篮能否放下', '02 / What fits in the basket'],
      paragraphs: [
        ['早餐燕麦案例需要 900 g，最多买到 1000 g。600 g 装的单位价格最低，买两包会超过上限。两包 450 g 刚好够，整包 1 kg 则少付 ¥0.10，代价是多出 100 g。', 'The oats case needs 900 g and allows up to 1000 g. The 600 g bag has the lowest unit price. Two of them exceed the ceiling. Two 450 g cartons fit exactly. The 1 kg bag costs ¥0.10 less and leaves 100 g extra.'],
        ['先手动加几包，再试试最省付款和余量最少两种结果。权衡列表按余量递增排列。只有能进一步降低付款的组合买法才会进入下一条。', 'Build a basket by hand, then try the cheapest plan and the one with the least surplus. Trade-offs run from less to more surplus. Each successive option must reduce the checkout cost.'],
      ],
      sources: [],
    },
    {
      title: ['03 / 库存、预算与单位边界', '03 / Stock, budget and units'],
      paragraphs: [
        ['每种规格只能拿整数包。程序逐一处理规格，在每个能买到的数量上保留最省的一篮，再筛选需求、余量和预算。两个显示相同的单价仍会按精确比例比较。', 'Each offer contributes whole packs. The planner processes offers one at a time, keeps the cheapest basket at each reachable quantity, and filters it by need, surplus and budget. Rates that look equal after rounding still use exact ratios for ranking.'],
        ['适合比较同款补货、活动物料或同规格用品。八案使用虚构价格和库存。克、毫升与件分别计算。品质、保质期、运费、跨商品优惠和多币种换算需要另行判断。', 'Use the desk for like-for-like refills, event supplies or matching items. The eight cases use fictional prices and stock. Grams, millilitres and pieces stay in separate workspaces. Quality, shelf life, shipping, cross-product promotions and currency conversion require separate judgment.'],
      ],
      sources: [],
    },
  ],
};

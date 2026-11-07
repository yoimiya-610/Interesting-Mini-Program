'use strict';
globalThis.ShelfCases = [
  {
    id: 'oats', name: ['早餐燕麦', 'Breakfast oats'], family: 'mass',
    brief: ['补足 900 g 燕麦，收纳罐最多再容纳 100 g。', 'Refill 900 g of oats with space for up to 100 g extra.'],
    task: ['找出单价最低的一包，再比较整篮最省与余量最少的买法。', 'Find the lowest unit price, then compare the cheapest basket with the one that leaves the least surplus.'],
    target: '900', surplus: '100', budget: '15.00',
    offers: [
      [['小袋', 'Small bag'], '250', 'g', '3.50', '4'],
      [['窄罐装', 'Slim carton'], '450', 'g', '6.80', '2'],
      [['实惠袋', 'Value bag'], '600', 'g', '7.60', '2'],
      [['家庭装', 'Family bag'], '1', 'kg', '13.50', '1'],
    ],
  },
  {
    id: 'beans', name: ['豆子补货', 'Bean refill'], family: 'mass',
    brief: ['需要 1 kg 同一种豆子。两种散装规格各剩一袋，预算 ¥17.50。', 'Buy 1 kg of the same beans. The two loose-pack sizes have one bag left each and the budget is ¥17.50.'],
    task: ['对照单一规格和混搭结果，看看库存如何改变可行买法。', 'Compare a single pack size with a mixed basket and see how stock changes the available plans.'],
    target: '1000', surplus: '200', budget: '17.50',
    offers: [
      [['散装小袋', 'Small loose bag'], '350', 'g', '6.10', '1'],
      [['散装大袋', 'Large loose bag'], '650', 'g', '10.90', '1'],
      [['整千克装', 'Kilogram pack'], '1', 'kg', '18.00', '1'],
      [['半千克装', 'Half-kilo pack'], '0.5', 'kg', '8.80', '2'],
    ],
  },
  {
    id: 'juice', name: ['聚会果汁', 'Juice for a gathering'], family: 'volume',
    brief: ['需要 1.5 L 同款果汁。聚会前只能多放 250 mL。', 'Provide 1.5 L of the same juice with room for at most 250 mL extra.'],
    task: ['把升和毫升换到同一尺度，再试试小瓶补齐混搭的末尾。', 'Put litres and millilitres on the same scale, then try topping up a mixed basket with a small bottle.'],
    target: '1500', surplus: '250', budget: '19.50',
    offers: [
      [['随身瓶', 'Small bottle'], '250', 'ml', '3.10', '4'],
      [['半升瓶', 'Half-litre bottle'], '0.5', 'l', '5.20', '2'],
      [['分享瓶', 'Sharing bottle'], '750', 'ml', '7.50', '1'],
      [['大纸盒', 'Large carton'], '1.5', 'l', '16.50', '1'],
    ],
  },
  {
    id: 'soap', name: ['洗手液补充', 'Hand soap refill'], family: 'volume',
    brief: ['两只瓶共需 1200 mL 同配方洗手液，柜中只能多存 100 mL。', 'Two bottles need 1200 mL of the same soap. The cupboard can hold 100 mL extra.'],
    task: ['把余量改为 0，比较能刚好补满的组合，再查每升单价。', 'Set surplus to zero, compare exact refills, then inspect the price per litre.'],
    target: '1200', surplus: '100', budget: '',
    offers: [
      [['普通补充袋', 'Regular pouch'], '400', 'ml', '5.20', '3'],
      [['双瓶补充袋', 'Double refill'], '600', 'ml', '7.50', '2'],
      [['大补充袋', 'Large pouch'], '0.9', 'l', '10.30', '2'],
      [['应急小袋', 'Small top-up'], '300', 'ml', '4.90', '4'],
    ],
  },
  {
    id: 'envelopes', name: ['展览信封', 'Exhibition envelopes'], family: 'count',
    brief: ['给 37 位来宾各准备一个同规格信封，先试试恰好买够。', 'Provide one matching envelope for each of 37 guests. Start by trying to buy exactly enough.'],
    task: ['每种包装都是 4 的倍数。逐步放宽余量，找出第一个可行上限。', 'Every pack size is divisible by four. Increase the surplus allowance until a basket fits.'],
    target: '37', surplus: '0', budget: '12.00',
    offers: [
      [['八只装', 'Pack of eight'], '8', 'each', '2.70', '4'],
      [['十二只装', 'Pack of twelve'], '12', 'each', '3.60', '2'],
      [['二十只装', 'Pack of twenty'], '20', 'each', '6.40', '2'],
      [['整盒四十只', 'Box of forty'], '40', 'each', '11.50', '1'],
    ],
  },
  {
    id: 'clips', name: ['装订夹预算', 'Binder clip budget'], family: 'count',
    brief: ['要 28 只同规格装订夹，可以多买 4 只，预算 ¥7.80。', 'Get 28 matching binder clips, with up to four extra and a ¥7.80 budget.'],
    task: ['先看预算缺口，再把预算调到刚好可行。', 'Inspect the budget gap, then increase the budget to the smallest feasible amount.'],
    target: '28', surplus: '4', budget: '7.80',
    offers: [
      [['五只包', 'Pack of five'], '5', 'each', '1.65', '8'],
      [['八只包', 'Pack of eight'], '8', 'each', '2.20', '3'],
      [['十四只盒', 'Box of fourteen'], '14', 'each', '4.00', '2'],
      [['三十只盒', 'Box of thirty'], '30', 'each', '8.10', '1'],
    ],
  },
  {
    id: 'tea', name: ['活动茶包', 'Tea bags for a workshop'], family: 'count',
    brief: ['为 27 位参加者备同一种茶包。货架四个规格的每袋价格一样。', 'Provide the same tea bag for each of 27 participants. All four offers have the same price per tea bag.'],
    task: ['用组合后的付款和余量区分单价并列的方案。', 'Use checkout cost and surplus to compare baskets when the unit prices tie.'],
    target: '27', surplus: '5', budget: '',
    offers: [
      [['六袋小包', 'Six-bag pack'], '6', 'each', '2.40', '6'],
      [['十袋中包', 'Ten-bag pack'], '10', 'each', '4.00', '3'],
      [['十五袋盒', 'Fifteen-bag box'], '15', 'each', '6.00', '3'],
      [['三十袋盒', 'Thirty-bag box'], '30', 'each', '12.00', '1'],
    ],
  },
  {
    id: 'clay', name: ['陶土工作坊', 'Clay workshop'], family: 'mass',
    brief: ['同一种陶土需要 2 kg，能带走最多 400 g 余量。最大的包装暂时售罄。', 'The workshop needs 2 kg of the same clay and can carry up to 400 g extra. The largest pack is sold out.'],
    task: ['检查库存能提供的最大数量，再试着给大包装补 1 包。', 'Check how much the shelf can supply, then try adding one large pack to stock.'],
    target: '2000', surplus: '400', budget: '',
    offers: [
      [['练习小块', 'Practice block'], '250', 'g', '4.20', '2'],
      [['半千克块', 'Half-kilo block'], '0.5', 'kg', '7.00', '1'],
      [['工作室块', 'Studio block'], '750', 'g', '9.30', '1'],
      [['大泥块', 'Large block'], '1.2', 'kg', '13.00', '0'],
    ],
  },
];

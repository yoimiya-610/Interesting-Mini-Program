'use strict';
(() => {
  const C = ShelfBasket;
  const $ = id => document.getElementById(id);
  const P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const KEY = 'imp-018-shelf-basket-v1';
  const labels = {
    kicker: ['八个购物案例', 'EIGHT SHOPPING CASES'],
    hero: ['看清单价，算好一篮', 'Read the label. Price the basket.'],
    intro: ['同款商品有不同包装。先把单位换到一起，再用整包拼出符合需求、库存、预算和余量限制的购物篮。', 'Compare pack sizes for the same product, then build a whole-pack basket within your needs, stock, budget and surplus limits.'],
    start: ['选择案例 ↓', 'Choose a case ↓'],
    goResults: ['查看购物篮 ↓', 'See the basket ↓'],
    readGuide: ['了解单价与方法 ↓', 'Read the guide ↓'],
    caseStep: ['01 / 购买条件', '01 / SHOPPING LIMITS'],
    caseLabel: ['案例', 'Case'],
    budgetLabel: ['预算（¥，可留空）', 'Budget (¥, optional)'],
    limitsHint: ['需求量和余量用下方标出的基本单位，均为整数。留空预算代表不限金额，0 代表只能拿免费包。价格最多两位小数，千克和升最多三位。', 'Enter need and surplus as whole base units shown above. A blank budget means any cost. Zero allows free packs only. Enter up to two decimals for money and three for kg or L.'],
    shelfStep: ['02 / 货架与手动拿取', '02 / SHELF AND PICKING'],
    shelfHeading: ['编辑包装与库存', 'Edit pack sizes and stock'],
    shelfHint: ['每案支持 1–8 种规格，每种库存为 0–12 包。用加减按钮手动拿取。降低库存时，原有拿取数量会保留，方便你逐项调整。', 'Each case holds 1–8 offers with 0–12 packs in stock per offer. Use the step buttons to pick packs. Reducing stock keeps your existing picks visible for adjustment.'],
    addOffer: ['添加规格', 'Add offer'],
    resetCase: ['恢复本案示例', 'Reset this case'],
    undo: ['撤销', 'Undo'],
    redo: ['重做', 'Redo'],
    resultStep: ['03 / 结算与权衡', '03 / CHECKOUT AND TRADE-OFFS'],
    resultHeading: ['购物篮对照', 'Basket comparison'],
    clearBasket: ['清空购物篮', 'Empty basket'],
    planner: ['可行组合买法', 'Feasible plans'],
    ranking: ['单位价格', 'Unit prices'],
    basis: ['统一比较单位', 'Reference unit'],
    rankingHint: ['按精确比例排序，金额显示到分。售罄规格仍可用于比较单价。', 'Ranking uses exact ratios. Displayed money rounds to cents. Sold-out offers stay visible for price comparison.'],
    dataHeading: ['笔记与备份', 'Notes and backup'],
    note: ['本案笔记', 'Case notes'],
    dataHint: ['八案各自保存于当前浏览器。可撤销最近 20 次编辑或操作，刷新会清除撤销历史。JSON 可备份全部案例与未完成输入，导入上限 256 KB。TXT 保存当前有效购物篮与笔记。', 'Each case saves separately in this browser. Undo up to 20 recent edits or actions. Reload clears undo history. JSON backs up all cases and incomplete inputs, with a 256 KB import limit. TXT records the current valid basket and notes.'],
    exportText: ['下载购物单 TXT', 'Download basket TXT'],
    exportJson: ['备份全部 JSON', 'Back up all cases as JSON'],
    importJson: ['导入完整备份', 'Import full backup'],
  };
  const errorText = {
    target: ['需求量须为 1–30,000 的整数。', 'Need must be a whole number from 1 to 30,000.'],
    surplus: ['余量须为非负整数，且需求量加余量不能超过 30,000。', 'Use a whole surplus of zero or more and keep need plus surplus at 30,000 or below.'],
    quantity: ['每包数量须为 1–30,000 的整数。', 'Pack quantity must be a whole number from 1 to 30,000.'],
    scaled: ['每包数量须为 0.001–30，最多三位小数。', 'Pack quantity must be from 0.001 to 30, with up to three decimals.'],
    money: ['金额须为 0–9,999.99，最多两位小数。', 'Use an amount from 0 to 9,999.99 with up to two decimals.'],
    stock: ['库存须为 0–12 的整数。', 'Stock must be a whole number from 0 to 12.'],
  };
  const units = {g: 'g', kg: 'kg', ml: 'mL', l: 'L'};
  const baseUnit = family => ({mass: 'g', volume: 'ml', count: 'each'})[family];
  const unitName = unit => units[unit] || P(['件', 'items']);
  const amount = (value, family) => family === 'count' && value === 1
    ? P(['1 件', '1 item']) : value + ' ' + unitName(baseUnit(family));
  const money = cents => '¥' + (cents / 100).toFixed(2);
  const packCount = n => n + P([' 包', n === 1 ? ' pack' : ' packs']);
  const priceUnit = (basis, family) => {
    if (family === 'count') return P(['每件', 'per item']);
    const label = basis === 1000 ? (family === 'mass' ? 'kg' : 'L') : amount(basis, family);
    return P(['每 ', 'per ']) + label;
  };
  const template = () => C.caseFor(state.selected);
  const draft = () => state.cases[state.selected];
  const offerName = (row, index) => row.name === null ? P(template().offers[row.id][0])
    : row.name || P(['规格 ', 'Offer ']) + (index + 1);

  let state = C.fresh();
  let storageOK = true;
  let notice = null;
  let revision = 0;
  let importSequence = 0;
  let editGroup = null;
  let composingField = null;
  let languagePending = false;
  let planKey = '';
  let cachedPlan = null;
  const past = [];
  const future = [];

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const restored = C.restore(JSON.parse(raw));
      if (restored) state = restored;
      else notice = ['可导入有效备份来恢复之前的数据。', 'Import a valid backup to recover previous data.'];
    }
  } catch {
    storageOK = false;
  }

  function node(tag, text, className) {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    if (className) result.className = className;
    return result;
  }

  function save() {
    revision++;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOK = true;
    } catch {
      storageOK = false;
    }
  }

  function remember() {
    past.push(C.copy(state));
    if (past.length > 20) past.shift();
    future.length = 0;
  }

  function change(action, rebuild = true) {
    remember();
    action();
    editGroup = null;
    notice = null;
    save();
    if (rebuild) render();
    else renderResults();
  }

  function bind(field, limit, write) {
    field.onfocus = () => { editGroup = null; };
    field.oninput = event => {
      if (event.isComposing) return;
      if (editGroup !== field) {
        remember();
        editGroup = field;
      }
      const clipped = [...field.value].slice(0, limit).join('');
      if (clipped !== field.value) field.value = clipped;
      write(clipped);
      notice = null;
      save();
      renderResults();
    };
    field.addEventListener('compositionstart', () => {
      composingField = field;
      revision++;
    });
    field.addEventListener('compositionend', event => {
      if (composingField === field) composingField = null;
      field.oninput(event);
      if (languagePending) {
        languagePending = false;
        render();
      }
    });
  }

  function fieldLabel(text, field) {
    const label = node('label');
    label.append(node('span', text), field);
    return label;
  }

  function numberField(row, key, mode) {
    const input = node('input');
    input.id = key + '-' + row.id;
    input.inputMode = mode;
    input.maxLength = 20;
    input.value = row[key];
    input.setAttribute('aria-describedby', 'issues');
    bind(input, 20, value => { row[key] = value; });
    return input;
  }

  function button(text, action, id) {
    const result = node('button', text);
    if (id) result.id = id;
    result.type = 'button';
    result.onclick = action;
    return result;
  }

  function renderOffer(row, index) {
    const card = node('div', undefined, 'offer');
    card.dataset.offer = row.id;
    const name = node('input');
    name.id = 'name-' + row.id;
    name.maxLength = 120;
    name.value = row.name ?? P(template().offers[row.id][0]);
    bind(name, 60, value => { row.name = value; });
    const remove = button(P(['移除', 'Remove']), () => {
      change(() => { draft().offers.splice(index, 1); });
      $('addOffer').focus();
    });
    remove.disabled = draft().offers.length === 1;
    const top = node('div', undefined, 'offer-top');
    top.append(fieldLabel(P(['规格名称', 'Offer name']) + ' ' + (index + 1), name), remove);

    const unit = node('select');
    for (const candidate of C.UNITS[template().family]) {
      const option = node('option', unitName(candidate));
      option.value = candidate;
      unit.append(option);
    }
    unit.value = row.unit;
    unit.onchange = () => change(() => { row.unit = unit.value; }, false);
    const fields = node('div', undefined, 'offer-fields');
    fields.append(
      fieldLabel(P(['每包数量', 'Pack quantity']), numberField(row, 'quantity', 'decimal')),
      fieldLabel(P(['数量单位', 'Quantity unit']), unit),
      fieldLabel(P(['每包价（¥）', 'Pack price (¥)']), numberField(row, 'price', 'decimal')),
      fieldLabel(P(['库存包数', 'Packs in stock']), numberField(row, 'stock', 'numeric')),
    );

    const stepper = node('div', undefined, 'stepper');
    const minus = button('−', () => change(() => { row.count--; }, false), 'minus-' + row.id);
    const plus = button('+', () => change(() => { row.count++; }, false), 'plus-' + row.id);
    const count = node('output');
    count.id = 'count-' + row.id;
    stepper.append(minus, count, plus);
    const bottom = node('div', undefined, 'offer-bottom');
    bottom.append(node('span', P(['篮中包数', 'Packs in basket'])), stepper);
    card.append(top, fields, bottom);
    return card;
  }

  function render() {
    for (const element of document.querySelectorAll('[data-i]')) element.textContent = P(labels[element.dataset.i]);
    const current = template();
    $('caseTitle').textContent = P(current.name);
    $('brief').textContent = P(current.brief);
    $('exercise').textContent = P(current.task);
    $('case').replaceChildren(...C.CASES.map(item => {
      const option = node('option', P(item.name));
      option.value = item.id;
      return option;
    }));
    $('case').value = state.selected;
    const unit = unitName(baseUnit(current.family));
    $('targetLabel').textContent = P(['需求量', 'Need']) + ' (' + unit + ')';
    $('surplusLabel').textContent = P(['最多余量', 'Maximum surplus']) + ' (' + unit + ')';
    for (const key of ['target', 'surplus', 'budget', 'note']) $(key).value = draft()[key];
    const bases = current.family === 'count' ? [1] : [100, 1000];
    $('basis').replaceChildren(...bases.map(value => {
      const option = node('option', priceUnit(value, current.family));
      option.value = value;
      return option;
    }));
    $('basis').value = draft().basis;
    $('basis').disabled = bases.length === 1;
    $('offers').replaceChildren(...draft().offers.map(renderOffer));
    renderResults();
  }

  function lines(counts) {
    return counts.flatMap((count, index) => count ? [offerName(draft().offers[index], index) + ' × ' + count] : []);
  }

  function renderBasket(model, basket) {
    const root = $('basket');
    const receipt = node('div', undefined, 'receipt');
    receipt.append(node('h3', P(['当前购物篮', 'Current basket'])));
    receipt.append(node('p', money(basket.cost) + ' · ' + amount(basket.quantity, model.family), 'tally'));
    receipt.append(node('p', packCount(basket.packs)));
    const flags = [];
    if (basket.overStock) flags.push(P(['有规格超过库存。', 'At least one offer exceeds its stock.']));
    if (basket.quantity < model.target) {
      flags.push(P(['还差 ', 'Still needed: ']) + amount(model.target - basket.quantity, model.family));
    } else if (basket.quantity > model.target + model.surplus) {
      flags.push(P(['超出余量上限 ', 'Above surplus limit by ']) + amount(basket.quantity - model.target - model.surplus, model.family));
    }
    if (model.budget !== null && basket.cost > model.budget) {
      flags.push(P(['超出预算 ', 'Over budget by ']) + money(basket.cost - model.budget));
    }
    if (flags.length) receipt.append(...flags.map(flag => node('p', flag, 'bad')));
    else receipt.append(node('p', P(['符合条件，余量 ', 'Fits all limits with surplus ']) + amount(basket.quantity - model.target, model.family)));
    const list = node('ul');
    list.append(...lines(basket.counts).map(line => node('li', line)));
    if (list.childElementCount) receipt.append(list);
    root.replaceChildren(receipt);
  }

  function renderPlans(model, result, basket) {
    const root = $('plans');
    const expanded = root.querySelector('details')?.open || false;
    root.replaceChildren();
    if (result.reason) {
      const messages = {
        shortStock: P(['库存最多提供 ', 'The shelf can supply up to ']) + amount(result.available, model.family) + P(['，低于需求。', ', below your need.']),
        quantityGap: P(['当前整包组合无法落在需求量和余量上限之间。', 'No whole-pack basket fits the quantity window.']),
        budgetGap: P(['满足数量与库存限制至少需 ', 'The least cost within quantity and stock limits is ']) + money(result.minimumCost) + P(['，超出预算。', ', above the budget.']),
      };
      root.append(node('p', messages[result.reason], 'bad'));
      return;
    }

    function planCard(title, candidate) {
      const item = node('div', undefined, 'plan');
      item.append(
        node('strong', title),
        node('p', money(candidate.cost) + ' · ' + amount(candidate.quantity, model.family) +
          ' · ' + P(['余量 ', 'Surplus ']) + amount(candidate.quantity - model.target, model.family)),
        node('p', lines(candidate.counts).join(' · '), 'hint'),
      );
      const apply = button(P(['采用这个购物篮', 'Use this basket']), () => {
        change(() => {
          draft().offers.forEach((row, index) => { row.count = candidate.counts[index]; });
        }, false);
        $('basket').focus();
      });
      apply.disabled = candidate.counts.every((count, index) => count === basket.counts[index]);
      item.append(apply);
      return item;
    }
    const same = result.cheapest.quantity === result.closest.quantity;
    root.append(planCard(same ? P(['付款和余量均最少', 'Lowest cost and least surplus']) : P(['最少付款', 'Lowest checkout cost']), result.cheapest));
    if (!same) root.append(planCard(P(['最少余量', 'Least surplus']), result.closest));
    if (result.single) root.append(planCard(P(['只买一种规格的最省买法', 'Cheapest plan using one offer']), result.single));
    else root.append(node('p', P(['只买一种规格时，当前条件无解。', 'The current limits require more than one offer.']), 'hint'));
    const middle = result.alternatives.filter(item => item.quantity !== result.closest.quantity && item.quantity !== result.cheapest.quantity);
    if (middle.length) {
      const details = node('details');
      details.open = expanded;
      details.append(node('summary', P(['更多付款与余量权衡', 'More cost and surplus trade-offs'])));
      details.append(node('p', P(['余量从小到大。查看余量最少的前 12 个有效数量中的其他选项。', 'See other options among the first 12 efficient quantities, ordered by surplus.']), 'hint'));
      details.append(...middle.map((item, index) => planCard(P(['权衡 ', 'Trade-off ']) + (index + 1), item)));
      root.append(details);
    }
  }

  function renderResults() {
    const model = C.inspect(template(), draft());
    for (const input of document.querySelectorAll('input[aria-describedby="issues"]')) {
      input.setAttribute('aria-invalid', String(input.id in model.errors));
    }
    model.offers.forEach((offer, index) => {
      const name = offerName(draft().offers[index], index);
      $('count-' + offer.id).textContent = offer.count;
      $('minus-' + offer.id).disabled = offer.count === 0;
      $('plus-' + offer.id).disabled = offer.stock === null || offer.count >= offer.stock;
      $('minus-' + offer.id).setAttribute('aria-label', P(['少拿一包 ', 'Remove one pack of ']) + name);
      $('plus-' + offer.id).setAttribute('aria-label', P(['多拿一包 ', 'Add one pack of ']) + name);
    });
    $('addOffer').disabled = draft().offers.length >= C.MAX_OFFERS;
    $('undo').disabled = !past.length;
    $('redo').disabled = !future.length;
    $('clearBasket').disabled = !draft().offers.some(row => row.count);
    $('storage').textContent = storageOK
      ? P(['已在本浏览器保存。', 'Saved in this browser.'])
      : P(['浏览器存储不可用。请下载 JSON 备份。', 'Browser storage is unavailable. Download a JSON backup.']);
    $('notice').textContent = notice ? P(notice) : '';

    const errors = Object.entries(model.errors);
    $('exportText').disabled = errors.length > 0;
    $('issues').replaceChildren();
    if (errors.length) {
      const list = node('ul');
      list.append(...errors.map(([field, error]) => {
        const index = draft().offers.findIndex(row => field.endsWith('-' + row.id));
        const prefix = index < 0 ? '' : offerName(draft().offers[index], index) + ' · ';
        return node('li', prefix + P(errorText[error]));
      }));
      $('issues').append(list);
      $('basket').replaceChildren(node('p', P(['修正标出的输入后可继续计算。', 'Correct the marked inputs to calculate the basket.'])));
      $('plans').replaceChildren();
      $('rates').replaceChildren();
      return;
    }

    const counts = model.offers.map(offer => offer.count);
    const basket = C.tally(model.offers, counts);
    renderBasket(model, basket);
    const key = JSON.stringify([model.target, model.surplus, model.budget,
      model.offers.map(offer => [offer.quantity, offer.price, offer.stock])]);
    if (key !== planKey) {
      planKey = key;
      cachedPlan = C.plan(model);
    }
    renderPlans(model, cachedPlan, basket);
    const ordered = model.offers.map((offer, index) => ({offer, index}))
      .sort((left, right) => C.compareUnitPrice(left.offer, right.offer) || left.index - right.index);
    $('rates').replaceChildren(...ordered.map(({offer, index}, rank) => {
      const lead = offerName(draft().offers[index], index) + ' · ';
      const rate = money(C.roundedUnitCents(offer, draft().basis)) + ' ' + priceUnit(draft().basis, model.family);
      const flags = [];
      if (C.compareUnitPrice(offer, ordered[0].offer) === 0) {
        flags.push(rank === 0 ? P(['最低单价', 'Lowest rate']) : P(['并列最低单价', 'Tied lowest rate']));
      }
      if (offer.stock === 0) flags.push(P(['售罄', 'Sold out']));
      return node('li', [lead + rate, ...flags].join(' · '));
    }));
  }

  for (const key of ['target', 'surplus', 'budget', 'note']) {
    bind($(key), key === 'note' ? 1000 : 20, value => { draft()[key] = value; });
  }
  $('case').onchange = () => {
    state.selected = $('case').value;
    editGroup = null;
    notice = null;
    save();
    render();
  };
  $('basis').onchange = () => change(() => { draft().basis = Number($('basis').value); }, false);
  $('resetCase').onclick = () => change(() => { state.cases[state.selected] = C.makeCase(template()); });
  $('clearBasket').onclick = () => change(() => { draft().offers.forEach(row => { row.count = 0; }); }, false);
  $('addOffer').onclick = () => {
    const id = Array.from({length: 12}, (_, index) => index + 4).find(value => !draft().offers.some(row => row.id === value));
    change(() => {
      draft().offers.push({id, name: '', quantity: '1', unit: baseUnit(template().family), price: '0.00', stock: '1', count: 0});
    });
    $('name-' + id).focus();
  };
  function traverse(from, to) {
    if (!from.length) return;
    to.push(C.copy(state));
    state = from.pop();
    editGroup = null;
    notice = null;
    save();
    render();
  }
  $('undo').onclick = () => traverse(past, future);
  $('redo').onclick = () => traverse(future, past);

  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('exportJson').onclick = () => download('shelf-basket.json', JSON.stringify(state, null, 2), 'application/json');
  $('importJson').onclick = () => $('importFile').click();
  $('exportText').onclick = () => {
    const model = C.inspect(template(), draft());
    if (Object.keys(model.errors).length) return;
    const basket = C.tally(model.offers, model.offers.map(offer => offer.count));
    const unit = model.family;
    const text = [
      '018 · ' + P(['货架算账', 'Shelf Basket']), P(template().name),
      P(['需求量 ', 'Need ']) + amount(model.target, unit),
      P(['最多余量 ', 'Maximum surplus ']) + amount(model.surplus, unit),
      P(['预算 ', 'Budget ']) + (model.budget === null ? P(['不限', 'Any cost']) : money(model.budget)),
      ...lines(basket.counts),
      P(['篮中合计 ', 'Basket total ']) + amount(basket.quantity, unit) + ' · ' + money(basket.cost),
      '', draft().note,
    ].join('\n');
    download('shelf-basket-' + state.selected + '.txt', text, 'text/plain;charset=utf-8');
  };
  $('importFile').onchange = async () => {
    const file = $('importFile').files[0];
    $('importFile').value = '';
    if (!file) return;
    const request = ++importSequence;
    const started = revision;
    let restored;
    try {
      if (file.size > C.MAX_BACKUP_BYTES) throw Error();
      restored = C.restore(JSON.parse(await file.text()));
      if (!restored) throw Error();
    } catch {
      if (request !== importSequence) return;
      notice = ['请选择 256 KB 以内的完整 JSON 备份。当前内容已保留。', 'Choose a complete JSON backup within 256 KB. Your work was kept.'];
      renderResults();
      return;
    }
    if (request !== importSequence) return;
    if (started !== revision || composingField) {
      notice = ['读取时发生编辑、组字或切换。当前内容已保留。', 'Editing, composition or navigation occurred during the read. Your work was kept.'];
      renderResults();
      return;
    }
    change(() => { state = restored; });
    notice = ['已导入八案，可撤销。', 'All eight cases imported. You can undo the import.'];
    renderResults();
  };
  window.addEventListener('programlanguagechange', () => {
    if (composingField) {
      languagePending = true;
      return;
    }
    editGroup = null;
    render();
  });
  render();
})();

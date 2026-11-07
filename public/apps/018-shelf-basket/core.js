'use strict';
(() => {
  const MAX_QUANTITY = 30000;
  const MAX_PRICE = 999999;
  const MAX_STOCK = 12;
  const MAX_OFFERS = 8;
  const MAX_BACKUP_BYTES = 256000;
  const CASES = globalThis.ShelfCases;
  const UNITS = {mass: ['g', 'kg'], volume: ['ml', 'l'], count: ['each']};
  const copy = value => JSON.parse(JSON.stringify(value));
  const caseFor = id => CASES.find(item => item.id === id);
  const textFits = (value, limit) => typeof value === 'string' && [...value].length <= limit;

  function makeCase(template) {
    return {
      target: template.target,
      surplus: template.surplus,
      budget: template.budget,
      basis: template.family === 'count' ? 1 : 100,
      note: '',
      offers: template.offers.map(([, quantity, unit, price, stock], id) => ({
        id, name: null, quantity, unit, price, stock, count: 0,
      })),
    };
  }

  function fresh() {
    return {
      version: 1,
      selected: CASES[0].id,
      cases: Object.fromEntries(CASES.map(template => [template.id, makeCase(template)])),
    };
  }

  function parseFixed(value, places, max) {
    if (!textFits(value, 20)) return null;
    const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
    if (!match || (match[2]?.length || 0) > places) return null;
    const whole = Number(match[1]);
    const fraction = Number((match[2] || '').padEnd(places, '0'));
    const result = whole * 10 ** places + fraction;
    return Number.isSafeInteger(result) && result <= max ? result : null;
  }

  function inspect(template, draft) {
    const errors = {};
    const target = parseFixed(draft.target, 0, MAX_QUANTITY);
    const surplus = parseFixed(draft.surplus, 0, MAX_QUANTITY);
    const budget = draft.budget.trim() === '' ? null : parseFixed(draft.budget, 2, MAX_PRICE);
    if (!target) errors.target = 'target';
    if (surplus === null || (target && target + surplus > MAX_QUANTITY)) errors.surplus = 'surplus';
    if (draft.budget.trim() && budget === null) errors.budget = 'money';

    const offers = draft.offers.map(row => {
      const places = row.unit === 'kg' || row.unit === 'l' ? 3 : 0;
      const quantity = parseFixed(row.quantity, places, MAX_QUANTITY);
      const price = parseFixed(row.price, 2, MAX_PRICE);
      const stock = parseFixed(row.stock, 0, MAX_STOCK);
      if (!quantity) errors['quantity-' + row.id] = places ? 'scaled' : 'quantity';
      if (price === null) errors['price-' + row.id] = 'money';
      if (stock === null) errors['stock-' + row.id] = 'stock';
      return {id: row.id, quantity, price, stock, count: row.count};
    });
    return {errors, target, surplus, budget, offers, family: template.family};
  }

  // Prices are cents and quantities are whole base units. Cross products keep
  // rounding in the display from creating a tie in the ranking.
  function compareUnitPrice(left, right) {
    return left.price * right.quantity - right.price * left.quantity;
  }

  function roundedUnitCents(offer, basis) {
    return Math.floor((2 * offer.price * basis + offer.quantity) / (2 * offer.quantity));
  }

  function tally(offers, counts) {
    let quantity = 0;
    let cost = 0;
    let packs = 0;
    let overStock = false;
    for (let index = 0; index < offers.length; index++) {
      const offer = offers[index];
      const count = counts[index];
      quantity += count * offer.quantity;
      cost += count * offer.price;
      packs += count;
      if (count > offer.stock) overStock = true;
    }
    return {quantity, cost, packs, counts, overStock};
  }

  function compareCost(left, right) {
    return left.cost - right.cost || left.quantity - right.quantity || left.packs - right.packs;
  }

  function plan({offers, target, surplus, budget}) {
    const ceiling = target + surplus;
    const available = offers.reduce((total, offer) => total + offer.quantity * offer.stock, 0);
    if (available < target) return {reason: 'shortStock', available};

    let costs = new Float64Array(ceiling + 1).fill(Infinity);
    let packs = new Uint16Array(ceiling + 1);
    const choices = [];
    costs[0] = 0;
    // Keep the least expensive basket at each reachable amount after each offer.
    // One row is processed at a time, so its stock cap applies to the whole plan.
    for (const offer of offers) {
      const nextCosts = new Float64Array(ceiling + 1).fill(Infinity);
      const nextPacks = new Uint16Array(ceiling + 1);
      const counts = new Uint8Array(ceiling + 1);
      for (let previous = 0; previous <= ceiling; previous++) {
        if (!Number.isFinite(costs[previous])) continue;
        const limit = Math.min(offer.stock, Math.floor((ceiling - previous) / offer.quantity));
        for (let count = 0; count <= limit; count++) {
          const amount = previous + count * offer.quantity;
          const cost = costs[previous] + count * offer.price;
          const packCount = packs[previous] + count;
          if (cost > nextCosts[amount] || (cost === nextCosts[amount] && packCount >= nextPacks[amount])) continue;
          nextCosts[amount] = cost;
          nextPacks[amount] = packCount;
          counts[amount] = count;
        }
      }
      choices.push(counts);
      costs = nextCosts;
      packs = nextPacks;
    }

    let minimumCost = Infinity;
    let lastFrontierCost = Infinity;
    let frontierCount = 0;
    let cheapestAmount = null;
    const firstAmounts = [];
    for (let amount = target; amount <= ceiling; amount++) {
      const cost = costs[amount];
      minimumCost = Math.min(minimumCost, cost);
      if ((budget !== null && cost > budget) || cost >= lastFrontierCost) continue;
      lastFrontierCost = cost;
      cheapestAmount = amount;
      frontierCount++;
      if (firstAmounts.length < 12) firstAmounts.push(amount);
    }
    if (!Number.isFinite(minimumCost)) return {reason: 'quantityGap', available};
    if (cheapestAmount === null) return {reason: 'budgetGap', minimumCost, available};

    function trace(amount) {
      let remaining = amount;
      const counts = new Array(offers.length);
      for (let index = offers.length - 1; index >= 0; index--) {
        counts[index] = choices[index][remaining];
        remaining -= counts[index] * offers[index].quantity;
      }
      return tally(offers, counts);
    }

    let single = null;
    for (let index = 0; index < offers.length; index++) {
      const offer = offers[index];
      const count = Math.ceil(target / offer.quantity);
      const amount = count * offer.quantity;
      const cost = count * offer.price;
      if (count > offer.stock || amount > ceiling || (budget !== null && cost > budget)) continue;
      const candidate = tally(offers, offers.map((_, row) => row === index ? count : 0));
      if (!single || compareCost(candidate, single) < 0) single = candidate;
    }

    return {
      cheapest: trace(cheapestAmount),
      closest: trace(firstAmounts[0]),
      alternatives: firstAmounts.map(trace),
      frontierCount, single, available,
    };
  }

  function restore(raw) {
    if (raw?.version !== 1 || !caseFor(raw.selected) || !raw.cases ||
        Object.keys(raw.cases).length !== CASES.length) return null;
    const cases = {};
    for (const template of CASES) {
      const draft = raw.cases[template.id];
      const bases = template.family === 'count' ? [1] : [100, 1000];
      if (!draft || !['target', 'surplus', 'budget'].every(key => textFits(draft[key], 20)) ||
          !textFits(draft.note, 1000) || !bases.includes(draft.basis) || !Array.isArray(draft.offers) ||
          draft.offers.length < 1 || draft.offers.length > MAX_OFFERS) return null;
      const ids = new Set();
      const offers = [];
      for (const row of draft.offers) {
        if (!row || !Number.isInteger(row.id) || row.id < 0 || row.id > 999 || ids.has(row.id) ||
            !(textFits(row.name, 60) || (row.name === null && row.id < template.offers.length)) ||
            !UNITS[template.family].includes(row.unit) ||
            !['quantity', 'price', 'stock'].every(key => textFits(row[key], 20)) ||
            !Number.isInteger(row.count) || row.count < 0 || row.count > MAX_STOCK) return null;
        ids.add(row.id);
        offers.push({
          id: row.id, name: row.name, quantity: row.quantity, unit: row.unit,
          price: row.price, stock: row.stock, count: row.count,
        });
      }
      cases[template.id] = {
        target: draft.target, surplus: draft.surplus, budget: draft.budget, basis: draft.basis,
        note: draft.note, offers,
      };
    }
    return {version: 1, selected: raw.selected, cases};
  }

  globalThis.ShelfBasket = {
    CASES, UNITS, MAX_OFFERS, MAX_STOCK, MAX_BACKUP_BYTES, copy, caseFor,
    makeCase, fresh, parseFixed, inspect, compareUnitPrice, roundedUnitCents, tally, plan, restore,
  };
})();

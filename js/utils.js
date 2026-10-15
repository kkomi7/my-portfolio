/* =============================================
   My Portfolio v5.36.7 — Utilities
   Cycle C: calcAssetValue extended (realized P&L, totalBuy/Sell, dates)
   uid() returns crypto.randomUUID string
   Scoped Cleanup for modular listener management
   ============================================= */

// ── HTML Security ──
function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escAttr(s) { return escHtml(s); }

function stripHtml(s, max = 200) {
  if (s == null) return '';
  return String(s).trim().slice(0, max).replace(/[<>]/g, '');
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

// ── Formatting ──
function fmtKRW(n) {
  n = safeNum(n);
  const sign = n < 0 ? '-' : '';
  return sign + '₩' + Math.abs(Math.round(n)).toLocaleString('ko-KR');
}

function fmtAmountHint(n) {
  n = safeNum(n);
  if (n <= 0) return '';
  const abs = Math.abs(n);
  if (abs >= 1e12) return '= ' + (n / 1e12).toFixed(2) + '조원';
  if (abs >= 1e8) return '= ' + (n / 1e8).toFixed(2) + '억원';
  if (abs >= 1e4) return '= ' + (n / 1e4).toFixed(0) + '만원';
  return '= ' + Math.round(n).toLocaleString('ko-KR') + '원';
}

function fmtAmountHintUSD(n) {
  n = safeNum(n);
  if (n <= 0) return '';
  const abs = Math.abs(n);
  if (abs >= 1e9) return '= $' + (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return '= $' + (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return '= $' + (n / 1e3).toFixed(1) + 'K';
  return '= $' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n, dec = 0) {
  n = safeNum(n);
  return n.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtPct(n, dec = 2) {
  n = safeNum(n);
  return (n >= 0 ? '+' : '') + n.toFixed(dec) + '%';
}

function fmtPrice(n) {
  n = safeNum(n);
  const abs = Math.abs(n);
  if (abs < 1) return n.toFixed(4);
  if (abs < 100) return n.toFixed(2);
  return Math.round(n).toLocaleString('ko-KR');
}

function fmtDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')}`;
}

function fmtDateTime(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${fmtDate(dt)} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

function fmtRelTime(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '일 전';
  return fmtDate(dateStr);
}

function profitClass(value) { return value >= 0 ? 'positive' : 'negative'; }

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isValidDate(str) {
  if (!str || typeof str !== 'string') return false;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && d.getDate() === Number(m[3]);
}

function clampDay(year, month, day) {
  const maxDay = new Date(year, month, 0).getDate();
  return Math.min(day, maxDay);
}

// ── FIRE / Goal Projection ──
// 현재자산(PV) + 월저축(PMT) + 연수익률(r*12)로 목표(target) 도달까지 개월수 반환.
// 도달 불가 시 Infinity. 이미 달성했으면 0.
function projectMonthsToTarget(currentAmount, targetAmount, monthlySaving, annualReturnPct) {
  const pv = safeNum(currentAmount);
  const tg = safeNum(targetAmount);
  const pmt = safeNum(monthlySaving);
  const r = safeNum(annualReturnPct) / 100 / 12;
  if (tg <= pv) return 0;
  if (r === 0) {
    if (pmt <= 0) return Infinity;
    return Math.ceil((tg - pv) / pmt);
  }
  // PV*(1+r)^n + PMT*((1+r)^n - 1)/r = tg
  // → (1+r)^n = (tg + PMT/r) / (PV + PMT/r)
  const denom = pv + pmt / r;
  if (denom <= 0) return Infinity;
  const x = (tg + pmt / r) / denom;
  if (x <= 1) return Infinity;
  const n = Math.log(x) / Math.log(1 + r);
  if (!isFinite(n) || n < 0) return Infinity;
  return Math.ceil(n);
}

// 4% 룰: 월 생활비 × 12 × 25 = FIRE 자산
function calcFireAmount(monthlyExpense) {
  return safeNum(monthlyExpense) * 12 * 25;
}

function fmtMonthsToKorean(months) {
  if (!isFinite(months) || months < 0) return '—';
  if (months === 0) return '지금 달성';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

function addMonthsFromNow(months) {
  if (!isFinite(months) || months < 0) return '';
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

// ── Allocation Drift ──
// 반환: [{ kind: 'category'|'asset', id, label, targetPct, actualPct, targetAmt, actualAmt, driftPct, driftAmt, status }]
// status: 'over' (target 초과), 'under' (target 부족), 'ok' (임계값 이내)
function calcAllocationDrift(assets, allocation, total, catTotals) {
  if (!allocation || !allocation.enabled) return [];
  const t = safeNum(total);
  if (t <= 0) return [];
  const threshold = safeNum(allocation.driftThreshold != null ? allocation.driftThreshold : ALLOC_DRIFT_THRESHOLD_DEFAULT);
  const cats = allocation.categories || {};
  const assetTargets = (allocation.assetOverride && allocation.assets) ? allocation.assets : {};
  const rows = [];
  const assetsById = new Map(assets.map(a => [String(a.id), a]));

  // 개별 종목 타겟이 설정된 카테고리별 carve-out 합계
  const carveByCatTarget = {};
  const carveByCatActual = {};

  // 개별 종목 행
  for (const [aid, targetPct] of Object.entries(assetTargets)) {
    const a = assetsById.get(String(aid));
    if (!a) continue;
    const val = safeNum(calcAssetValue(a).value);
    const actualPct = (val / t) * 100;
    const tp = safeNum(targetPct);
    const targetAmt = t * tp / 100;
    const driftPct = actualPct - tp;
    rows.push({
      kind: 'asset',
      id: String(aid),
      label: a.name,
      category: a.category,
      targetPct: tp,
      actualPct,
      targetAmt,
      actualAmt: val,
      driftPct,
      driftAmt: val - targetAmt,
      status: Math.abs(driftPct) > threshold ? (driftPct > 0 ? 'over' : 'under') : 'ok',
    });
    carveByCatTarget[a.category] = safeNum(carveByCatTarget[a.category]) + tp;
    carveByCatActual[a.category] = safeNum(carveByCatActual[a.category]) + val;
  }

  // 카테고리 행 (carve-out 제외분)
  for (const cat of CATEGORIES) {
    const cid = cat.id;
    const rawTargetPct = safeNum(cats[cid]);
    const rawActualAmt = safeNum(catTotals[cid]);
    const carveT = safeNum(carveByCatTarget[cid]);
    const carveA = safeNum(carveByCatActual[cid]);
    const adjTargetPct = Math.max(0, rawTargetPct - carveT);
    const adjActualAmt = Math.max(0, rawActualAmt - carveA);
    if (adjTargetPct === 0 && adjActualAmt === 0) continue;
    const adjActualPct = (adjActualAmt / t) * 100;
    const targetAmt = t * adjTargetPct / 100;
    const driftPct = adjActualPct - adjTargetPct;
    const hasCarve = carveT > 0 || carveA > 0;
    rows.push({
      kind: 'category',
      id: cid,
      label: hasCarve ? `${cid} (기타)` : cid,
      category: cid,
      targetPct: adjTargetPct,
      actualPct: adjActualPct,
      targetAmt,
      actualAmt: adjActualAmt,
      driftPct,
      driftAmt: adjActualAmt - targetAmt,
      status: Math.abs(driftPct) > threshold ? (driftPct > 0 ? 'over' : 'under') : 'ok',
    });
  }

  return rows;
}

// 리밸런싱 제안 — driftRows 중 임계값 넘는 것만, 절댓값 큰 순
function getRebalancingSuggestions(driftRows, threshold) {
  if (!Array.isArray(driftRows)) return [];
  const th = safeNum(threshold != null ? threshold : ALLOC_DRIFT_THRESHOLD_DEFAULT);
  return driftRows
    .filter(r => Math.abs(r.driftPct) > th)
    .sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct))
    .map(r => ({
      ...r,
      direction: r.driftPct > 0 ? 'sell' : 'buy',
      rebalanceAmt: Math.abs(r.driftAmt),
    }));
}

// 카테고리 목표 합계 (편집기 상단 표시용)
function sumAllocationCategoryPct(categories) {
  if (!categories || typeof categories !== 'object') return 0;
  let s = 0;
  for (const cid of CAT_IDS) s += safeNum(categories[cid]);
  return s;
}

// ── Stock Sector Inference ──
function normalizeTicker(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\.(KS|KQ|O|N|L)$/i, '');
}

function isStockAsset(asset) {
  return !!asset && STOCK_CATS.includes(asset.category);
}

function getStockRegion(asset) {
  if (!asset) return null;
  if (asset.category === '국내주식') return { id: 'domestic', label: '국내주식' };
  if (asset.category === '해외주식') return { id: 'foreign', label: '해외주식' };
  const market = String(asset.market || '').toUpperCase();
  if (['KOSPI', 'KOSDAQ'].includes(market)) return { id: 'domestic', label: '국내주식' };
  if (['NYSE', 'NASDAQ'].includes(market)) return { id: 'foreign', label: '해외주식' };
  return null;
}

function inferStockSector(asset) {
  if (!isStockAsset(asset)) return null;
  const code = normalizeTicker(asset.stockCode);
  const rawCode = String(asset.stockCode || '').trim().toUpperCase();
  const text = `${asset.name || ''} ${asset.note || ''} ${rawCode}`.toLowerCase();
  const rules = STOCK_SECTOR_RULES.filter(r => r.id !== 'other_stock');

  for (const rule of rules) {
    const tickers = new Set((rule.tickers || []).map(normalizeTicker));
    if (code && tickers.has(code)) return rule;
    if (rawCode && (rule.tickers || []).some(t => String(t).toUpperCase() === rawCode)) return rule;
    if ((rule.keywords || []).some(k => text.includes(String(k).toLowerCase()))) return rule;
  }

  const nameUpper = String(asset.name || '').toUpperCase();
  if (ETF_PREFIXES.some(prefix => nameUpper.startsWith(prefix))) {
    return STOCK_SECTOR_MAP.broad_etf;
  }
  return STOCK_SECTOR_MAP.other_stock;
}

function calcStockSectorTotals(assets) {
  const totals = {};
  const costTotals = {};
  const sectorAssets = {};
  const regions = {
    domestic: { id: 'domestic', label: '국내주식', total: 0, costTotal: 0, totals: {}, costTotals: {}, assets: {} },
    foreign: { id: 'foreign', label: '해외주식', total: 0, costTotal: 0, totals: {}, costTotals: {}, assets: {} },
  };
  let stockTotal = 0;
  let stockCostTotal = 0;
  for (const rule of STOCK_SECTOR_RULES) {
    totals[rule.id] = 0;
    costTotals[rule.id] = 0;
    sectorAssets[rule.id] = [];
    for (const region of Object.values(regions)) {
      region.totals[rule.id] = 0;
      region.costTotals[rule.id] = 0;
      region.assets[rule.id] = [];
    }
  }

  for (const asset of assets || []) {
    if (!isStockAsset(asset)) continue;
    const assetValue = calcAssetValue(asset);
    const value = safeNum(assetValue.value);
    if (value <= 0) continue;
    const cost = safeNum(assetValue.cost);
    const sector = inferStockSector(asset) || STOCK_SECTOR_MAP.other_stock;
    const region = getStockRegion(asset);
    totals[sector.id] = safeNum(totals[sector.id]) + value;
    costTotals[sector.id] = safeNum(costTotals[sector.id]) + cost;
    stockTotal += value;
    stockCostTotal += cost;
    sectorAssets[sector.id].push({ asset, value, cost });
    if (region && regions[region.id]) {
      regions[region.id].total += value;
      regions[region.id].costTotal += cost;
      regions[region.id].totals[sector.id] = safeNum(regions[region.id].totals[sector.id]) + value;
      regions[region.id].costTotals[sector.id] = safeNum(regions[region.id].costTotals[sector.id]) + cost;
      regions[region.id].assets[sector.id].push({ asset, value, cost });
    }
  }

  const buildRows = (bucketTotals, bucketCostTotals, bucketAssets) => STOCK_SECTOR_RULES
    .map(rule => ({
      ...rule,
      value: safeNum(bucketTotals[rule.id]),
      cost: safeNum(bucketCostTotals[rule.id]),
      assets: bucketAssets[rule.id] || [],
    }))
    .filter(row => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const rows = buildRows(totals, costTotals, sectorAssets);
  const groups = Object.values(regions)
    .map(region => ({
      id: region.id,
      label: region.label,
      total: safeNum(region.total),
      costTotal: safeNum(region.costTotal),
      rows: buildRows(region.totals, region.costTotals, region.assets),
      unclassified: (region.assets.other_stock || []).map(item => item.asset),
    }))
    .filter(region => region.total > 0 && region.rows.length > 0);

  return {
    total: safeNum(stockTotal),
    costTotal: safeNum(stockCostTotal),
    rows,
    groups,
    unclassified: (sectorAssets.other_stock || []).map(item => item.asset),
  };
}

// ── Calculations (NaN-safe, cached per render cycle) ──
let _calcCache = null;
let _calcCacheKey = 0;

function invalidateCalcCache() { _calcCacheKey++; _calcCache = null; }

function calcAssetValue(asset) {
  const txns = (asset.txns || []).map((txn, index) => ({ txn, index }))
    .sort((a, b) => (a.txn.date || '').localeCompare(b.txn.date || '') || a.index - b.index)
    .map(entry => entry.txn);
  let qty = 0, cost = 0;
  let realizedProfit = 0;
  let totalBuy = 0, totalSell = 0;
  let firstBuyDate = null, lastTxnDate = null;
  for (const t of txns) {
    const tPrice = safeNum(t.price);
    const tQty = safeNum(t.qty);
    const tFee = Math.max(0, safeNum(t.fee));
    const tDate = (t.date && typeof t.date === 'string') ? t.date : null;
    if (tDate) {
      if (!lastTxnDate || tDate > lastTxnDate) lastTxnDate = tDate;
    }
    if (t.type === 'buy') {
      qty += tQty;
      cost += tPrice * tQty + tFee;
      totalBuy += tPrice * tQty + tFee;
      if (tDate && (!firstBuyDate || tDate < firstBuyDate)) firstBuyDate = tDate;
    } else {
      totalSell += tPrice * tQty;
      if (qty > 0) {
        const sellQty = Math.min(tQty, qty);
        const avgCost = cost / qty;
        realizedProfit += (tPrice - avgCost) * sellQty - tFee;
        cost -= avgCost * sellQty;
        qty -= sellQty;
      }
    }
    qty = Math.max(0, qty);
    cost = Math.max(0, cost);
  }
  const price = safeNum(asset.amount);
  const value = safeNum(price * qty);
  const profit = safeNum(value - cost);
  const profitPct = cost > 0 ? safeNum((profit / cost) * 100) : 0;
  const avgPrice = qty > 0 ? safeNum(cost / qty) : 0;
  const realizedPct = totalBuy > 0 ? safeNum((realizedProfit / totalBuy) * 100) : 0;
  return {
    qty, cost, value, profit, profitPct, avgPrice, price,
    realizedProfit: safeNum(realizedProfit),
    realizedPct,
    totalBuy: safeNum(totalBuy),
    totalSell: safeNum(totalSell),
    firstBuyDate,
    lastTxnDate,
  };
}

function calcInvestmentTradeRows(assets) {
  const rows = [];
  for (const asset of (Array.isArray(assets) ? assets : [])) {
    if (!INVESTMENT_CATS.includes(asset.category) || !Array.isArray(asset.txns)) continue;
    let qty = 0;
    let cost = 0;
    let poolFirstBuyDate = null;
    const openBuyLots = [];
    const orderedTxns = asset.txns.map((txn, txnIndex) => ({ txn, txnIndex }))
      .sort((a, b) => (a.txn.date || '').localeCompare(b.txn.date || '') || a.txnIndex - b.txnIndex);
    orderedTxns.forEach(({ txn, txnIndex }) => {
      const price = safeNum(txn.price);
      const txnQty = Math.max(0, safeNum(txn.qty));
      const fee = Math.max(0, safeNum(txn.fee));
      const gross = price * txnQty;
      const date = txn.date || today();
      let costBasis = 0;
      let realizedProfit = 0;
      let realizedPct = 0;
      let holdingDays = null;
      let buyDate = null;
      const matchedBuyIds = [];
      const matchedBuys = [];

      if (txn.type === 'buy') {
        if (qty < 1e-9) poolFirstBuyDate = date;
        qty += txnQty;
        cost += gross + fee;
      } else {
        const sellQty = Math.min(txnQty, qty);
        const avgCost = qty > 0 ? cost / qty : 0;
        costBasis = avgCost * sellQty;
        realizedProfit = gross - fee - costBasis;
        realizedPct = costBasis > 0 ? (realizedProfit / costBasis) * 100 : 0;
        buyDate = poolFirstBuyDate;
        let qtyToMatch = txnQty;
        for (const lot of openBuyLots) {
          if (qtyToMatch <= 1e-9) break;
          if (lot.remainingQty <= 1e-9) continue;
          const matchedQty = Math.min(qtyToMatch, lot.remainingQty);
          lot.remainingQty -= matchedQty;
          lot.row.remainingQty = Math.max(0, lot.remainingQty);
          lot.row.soldQty = Math.max(0, lot.row.qty - lot.row.remainingQty);
          matchedBuyIds.push(lot.row.id);
          matchedBuys.push({ id: lot.row.id, qty: matchedQty });
          qtyToMatch -= matchedQty;
        }
        if (buyDate && isValidDate(buyDate) && isValidDate(date)) {
          holdingDays = Math.max(0, Math.floor((new Date(date).getTime() - new Date(buyDate).getTime()) / 86400000));
        }
        cost = Math.max(0, cost - costBasis);
        qty = Math.max(0, qty - sellQty);
        if (qty < 1e-9) poolFirstBuyDate = null;
      }

      const row = {
        id: txn.id,
        assetId: asset.id,
        assetName: asset.name,
        stockCode: asset.stockCode || '',
        category: asset.category,
        account: txn.account || '',
        type: txn.type === 'sell' ? 'sell' : 'buy',
        date,
        buyDate,
        holdingDays,
        price,
        qty: txnQty,
        gross,
        fee,
        netAmount: txn.type === 'sell' ? gross - fee : gross + fee,
        costBasis,
        realizedProfit,
        realizedPct,
        currentPrice: safeNum(asset.amount),
        memo: txn.memo || '',
        txnIndex,
        remainingQty: txn.type === 'buy' ? txnQty : null,
        soldQty: 0,
        matchedBuyIds,
        matchedBuys,
      };
      rows.push(row);
      if (txn.type === 'buy') openBuyLots.push({ row, remainingQty: txnQty });
    });
  }
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.txnIndex - a.txnIndex);
}

function _buildCalcCache(assets) {
  const key = _calcCacheKey;
  if (_calcCache && _calcCache._key === key) return _calcCache;
  const byAsset = new Map();
  const byCat = {};
  let total = 0;
  for (const cat of CATEGORIES) byCat[cat.id] = 0;
  for (const a of assets) {
    const v = calcAssetValue(a);
    byAsset.set(a.id, v);
    byCat[a.category] = safeNum(byCat[a.category]) + safeNum(v.value);
    total += safeNum(v.value);
  }
  _calcCache = { _key: key, byAsset, byCat, total: safeNum(total) };
  return _calcCache;
}

function calcCategoryTotal(assets, catId) {
  return _buildCalcCache(assets).byCat[catId] || 0;
}

function calcTotal(assets) {
  return _buildCalcCache(assets).total;
}

function calcCategoryTotals(assets) {
  return { ..._buildCalcCache(assets).byCat };
}

// ── Validation ──
function isValidAsset(a) {
  return a && typeof a.name === 'string' && a.name.trim().length > 0 &&
    CAT_IDS.includes(a.category) && Array.isArray(a.txns);
}

// sanitizeAsset: coerces ID to String for backward compatibility with v2.x numeric IDs
function sanitizeAsset(a) {
  return {
    id: a.id != null ? String(a.id) : uid(),
    name: stripHtml(a.name, 100) || '이름 없음',
    category: CAT_IDS.includes(a.category) ? a.category : '기타',
    amount: safeNum(a.amount),
    note: a.note ? stripHtml(a.note, 500) : null,
    stockCode: a.stockCode ? stripHtml(a.stockCode, 20) : '',
    market: ['KOSPI','KOSDAQ','NYSE','NASDAQ',''].includes(a.market) ? a.market : '',
    coinId: a.coinId ? stripHtml(a.coinId, 100) : '',
    isUsdt: !!a.isUsdt,
    usdtQty: a.usdtQty != null ? safeNum(a.usdtQty) : undefined,
    usdtDetails: Array.isArray(a.usdtDetails) ? a.usdtDetails.slice(0, 50).map(d => ({ name: stripHtml(d.name, 50), qty: safeNum(d.qty) })) : undefined,
    usdtHistory: Array.isArray(a.usdtHistory) ? a.usdtHistory.slice(-LIMITS.usdtHistory).map(h => ({
      at: typeof h.at === 'string' ? h.at : new Date().toISOString(),
      usdtQty: safeNum(h.usdtQty),
      usdtDetails: Array.isArray(h.usdtDetails) ? h.usdtDetails.slice(0, 50).map(d => ({ name: stripHtml(d.name, 50), qty: safeNum(d.qty) })) : [],
      amount: safeNum(h.amount),
    })) : undefined,
    walletCoinId: a.walletCoinId ? stripHtml(String(a.walletCoinId), 100) : undefined,
    lpu: (a.lpu && typeof a.lpu === 'string') ? stripHtml(a.lpu, 50) : null,
    txns: Array.isArray(a.txns) ? a.txns.slice(0, LIMITS.txns).map(sanitizeTxn) : [],
  };
}

// sanitizeTxn: coerces ID to String
function sanitizeTxn(t) {
  return {
    id: t.id != null ? String(t.id) : uid(),
    type: t.type === 'sell' ? 'sell' : 'buy',
    price: safeNum(t.price),
    qty: Math.max(0, safeNum(t.qty)),
    fee: Math.max(0, safeNum(t.fee)),
    account: t.account ? stripHtml(t.account, 50) : null,
    date: isValidDate(t.date) ? t.date : today(),
    memo: t.memo ? stripHtml(t.memo, 200) : null,
  };
}

function sanitizeLedgerUrl(value) {
  const clean = String(value || '').trim().slice(0, 2048);
  if (!clean) return '';
  try {
    const parsed = new URL(clean);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch (_) {
    return '';
  }
}

function sanitizeLedgerImage(value) {
  const clean = typeof value === 'string' ? value : '';
  if (clean.length > 900000) return '';
  return /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(clean) ? clean : '';
}

// sanitizeIncome: coerces ID to String and preserves hierarchical ledger categories
function sanitizeIncome(i) {
  const type = ['expense', 'saving'].includes(i.type) ? i.type : 'income';
  const amount = Math.abs(safeNum(i.amount));
  const hasSeparateItem = Object.prototype.hasOwnProperty.call(i, 'item');
  const item = hasSeparateItem ? (i.item ? stripHtml(i.item, 120) : '') : (i.memo ? stripHtml(i.memo, 120) : '');
  const memo = hasSeparateItem && i.memo ? stripHtml(i.memo, 200) : '';
  const lineItems = Array.isArray(i.lineItems) ? i.lineItems.slice(0, 30).map(line => {
    const qty = Math.max(1, Math.floor(safeNum(line?.qty) || 1));
    const storedAmount = Math.abs(safeNum(line?.amount));
    const unitPrice = Math.abs(safeNum(line?.unitPrice)) || (storedAmount / qty);
    return {
      id: line?.id != null ? String(line.id) : uid(),
      name: line?.name ? stripHtml(line.name, 120) : '',
      qty,
      unitPrice,
      amount: unitPrice * qty,
      cat: line?.cat ? stripHtml(line.cat, 80) : 'other',
      subcat: line?.subcat ? stripHtml(line.subcat, 40) : '',
    };
  }).filter(line => line.name && line.amount > 0) : [];
  const costType = type === 'expense' && ['fixed', 'variable'].includes(i.costType) ? i.costType : '';
  const needType = type === 'expense' && ['essential', 'optional'].includes(i.needType) ? i.needType : '';
  const repeatCycle = ['monthly', 'yearly'].includes(i.repeatCycle)
    ? i.repeatCycle
    : (i.recurring ? 'monthly' : '');
  const advanceAmount = type === 'expense'
    ? Math.min(amount, Math.max(0, safeNum(i.advanceAmount)))
    : 0;
  const settledAmount = Math.min(advanceAmount, Math.max(0, safeNum(i.settledAmount)));
  const originalAmount = type === 'expense' && safeNum(i.originalAmount) > amount
    ? Math.max(amount, safeNum(i.originalAmount)) : 0;
  const savingIncluded = type === 'saving'
    ? (typeof i.savingIncluded === 'boolean' ? i.savingIncluded : i.cat !== 'transfer')
    : false;
  return {
    id: i.id != null ? String(i.id) : uid(),
    type,
    date: isValidDate(i.date) ? i.date : today(),
    amount,
    cat: i.cat ? stripHtml(i.cat, 80) : 'other',
    subcat: i.subcat ? stripHtml(i.subcat, 40) : '',
    payment: i.payment ? stripHtml(i.payment, 40) : '',
    fromAccount: i.fromAccount ? stripHtml(i.fromAccount, 80) : '',
    toAccount: i.toAccount ? stripHtml(i.toAccount, 80) : '',
    source: i.source ? stripHtml(i.source, 100) : '',
    item,
    memo,
    lineItems,
    recurring: repeatCycle === 'monthly',
    repeatCycle,
    subscription: type === 'expense' && !!i.subscription,
    advanceAmount,
    settledAmount,
    settledDate: settledAmount > 0 && isValidDate(i.settledDate) ? i.settledDate : '',
    originalAmount,
    costType,
    needType,
    savingIncluded,
    relatedUrl: sanitizeLedgerUrl(i.relatedUrl),
    receiptImage: sanitizeLedgerImage(i.receiptImage),
    receiptImageName: i.receiptImageName ? stripHtml(i.receiptImageName, 100) : '',
    linkedAssetId: i.linkedAssetId != null ? String(i.linkedAssetId) : '',
    linkedTxnId: i.linkedTxnId != null ? String(i.linkedTxnId) : '',
    autoInvestmentIncome: Boolean(i.autoInvestmentIncome),
  };
}

function sanitizePointEntry(entry) {
  const type = ['earned', 'used', 'expired', 'adjusted'].includes(entry?.type) ? entry.type : 'earned';
  return {
    id: entry?.id != null ? String(entry.id) : uid(),
    provider: stripHtml(entry?.provider || '', 40),
    type,
    amount: Math.abs(safeNum(entry?.amount)),
    date: isValidDate(entry?.date) ? entry.date : today(),
    memo: entry?.memo ? stripHtml(entry.memo, 160) : '',
  };
}

function sanitizeFamilyFundEntry(entry) {
  const type = entry?.type === 'used' ? 'used' : 'received';
  return {
    id: entry?.id != null ? String(entry.id) : uid(),
    type,
    person: type === 'received' ? stripHtml(entry?.person || '', 40) : '',
    amount: Math.abs(safeNum(entry?.amount)),
    date: isValidDate(entry?.date) ? entry.date : today(),
    purpose: stripHtml(entry?.purpose || '주택담보대출 상환', 100),
    memo: entry?.memo ? stripHtml(entry.memo, 180) : '',
    isEstimate: Boolean(entry?.isEstimate),
  };
}

function sanitizeSettlementLedger(item) {
  const startingAmount = Math.abs(safeNum(item?.startingAmount));
  const repayments = (Array.isArray(item?.repayments) ? item.repayments : []).slice(-1000).map(payment => ({
    id: payment?.id != null ? String(payment.id) : uid(),
    date: isValidDate(payment?.date) ? payment.date : today(),
    amount: Math.abs(safeNum(payment?.amount)),
    memo: payment?.memo ? stripHtml(payment.memo, 120) : '',
  })).filter(payment => payment.amount > 0);
  return {
    id: item?.id != null ? String(item.id) : uid(),
    person: stripHtml(item?.person || '', 40),
    title: stripHtml(item?.title || '', 80),
    startingAmount,
    isEstimate: Boolean(item?.isEstimate),
    startDate: isValidDate(item?.startDate) ? item.startDate : today(),
    memo: item?.memo ? stripHtml(item.memo, 200) : '',
    repayments,
  };
}

function sanitizeGifticon(item) {
  const source = ['gift', 'purchased', 'reward'].includes(item?.source) ? item.source : 'gift';
  const status = ['unused', 'used', 'sold', 'expired'].includes(item?.status) ? item.status : 'unused';
  const faceValue = Math.abs(safeNum(item?.faceValue));
  return {
    id: item?.id != null ? String(item.id) : uid(),
    brand: stripHtml(item?.brand || '', 40),
    name: stripHtml(item?.name || '', 100),
    faceValue,
    purchasePrice: source === 'purchased' ? Math.min(faceValue || Number.MAX_SAFE_INTEGER, Math.abs(safeNum(item?.purchasePrice))) : 0,
    source,
    receivedDate: isValidDate(item?.receivedDate) ? item.receivedDate : today(),
    expiresDate: isValidDate(item?.expiresDate) ? item.expiresDate : '',
    status,
    completedDate: status === 'unused' ? '' : (isValidDate(item?.completedDate) ? item.completedDate : today()),
    saleAmount: status === 'sold' ? Math.abs(safeNum(item?.saleAmount)) : 0,
    memo: item?.memo ? stripHtml(item.memo, 160) : '',
  };
}

// ── DOM Helpers ──
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k.startsWith('on')) continue;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c instanceof Node) e.appendChild(c);
  }
  return e;
}

function showToast(msg, type = 'info') {
  const existing = $('.toast');
  if (existing) existing.remove();
  const t = el('div', { class: `toast toast-${type}`, text: msg, role: 'status' });
  const container = $('#toastContainer') || document.body;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), TOAST_FADE_MS);
  }, TOAST_DURATION_MS);
}

function showUndoToast(msg, undoFn, durationMs = 5000) {
  const existing = $('.toast');
  if (existing) existing.remove();
  const t = el('div', { class: 'toast toast-info toast-undo', role: 'status' });
  t.appendChild(el('span', { class: 'toast-undo-msg', text: msg }));
  const btn = el('button', { class: 'toast-undo-btn', type: 'button', text: '실행 취소' });
  t.appendChild(btn);
  const container = $('#toastContainer') || document.body;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    t.classList.remove('show');
    setTimeout(() => t.remove(), TOAST_FADE_MS);
  };
  btn.addEventListener('click', () => {
    if (dismissed) return;
    dismissed = true;
    t.remove();
    if (typeof undoFn === 'function') undoFn();
    showToast('복원되었습니다', 'success');
  });
  setTimeout(dismiss, durationMs);
}

// ── Chart.js Safety ──
function isChartReady() {
  return typeof Chart !== 'undefined';
}

// ── Misc ──
function debounce(fn, ms = DEBOUNCE_MS) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// uid() uses crypto.randomUUID() — returns a STRING.
// NEVER wrap uid() results in Number() — they are not numeric.
function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function groupBy(arr, key) {
  return arr.reduce((g, item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    (g[k] = g[k] || []).push(item);
    return g;
  }, {});
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Scoped Cleanup Registry ──
const Cleanup = (() => {
  const _scopes = {};

  function _getScope(name) {
    if (!_scopes[name]) _scopes[name] = [];
    return _scopes[name];
  }

  return {
    scope(name) {
      return {
        add(element, event, handler, options) {
          element.addEventListener(event, handler, options);
          _getScope(name).push({ element, event, handler, options });
        },
        removeAll() {
          const listeners = _getScope(name);
          for (const { element, event, handler, options } of listeners) {
            try { element.removeEventListener(event, handler, options); } catch (e) {
              console.warn(`Cleanup.scope(${name}).removeAll: failed`, event, e);
            }
          }
          _scopes[name] = [];
        },
        removeForElement(el) {
          const scope = _getScope(name);
          _scopes[name] = scope.filter(l => {
            if (l.element === el) {
              try { l.element.removeEventListener(l.event, l.handler, l.options); } catch (e) {
                console.warn(`Cleanup.scope(${name}).removeForElement: failed`, l.event, e);
              }
              return false;
            }
            return true;
          });
        },
      };
    },

    add(element, event, handler, options) {
      element.addEventListener(event, handler, options);
      _getScope('global').push({ element, event, handler, options });
    },

    removeAll() {
      for (const name of Object.keys(_scopes)) {
        for (const { element, event, handler, options } of _scopes[name]) {
          try { element.removeEventListener(event, handler, options); } catch (e) {
            console.warn('Cleanup.removeAll: failed', event, e);
          }
        }
        _scopes[name] = [];
      }
    },

    removeForElement(targetEl) {
      for (const name of Object.keys(_scopes)) {
        _scopes[name] = _scopes[name].filter(l => {
          if (l.element === targetEl) {
            try { l.element.removeEventListener(l.event, l.handler, l.options); } catch (e) {
              console.warn('Cleanup.removeForElement: failed', l.event, e);
            }
            return false;
          }
          return true;
        });
      }
    },
  };
})();

// ── Idle scheduling: 무거운 렌더(차트 등)를 idle frame으로 미뤄 첫 페인트를 방해하지 않도록 ──
function runWhenIdle(fn, timeout = 200) {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(fn, { timeout });
  }
  return setTimeout(fn, 1);
}

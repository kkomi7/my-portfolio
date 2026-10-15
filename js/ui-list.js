/* =============================================
   My Portfolio v5.36.7 — Asset List UI
   Cycle C: 보유중/매도완료 탭 (C-15)
   Soft Neutral: cleaner toolbar, stagger animations
   Drag&Drop logic preserved from v4.4.1
   ============================================= */

let _dragAssetId = null;
let _dragCatName = null;
let _dragInsertBefore = false;
let _touchDragEl = null;
let _touchClone = null;
let _touchInsertBefore = false;
let _dragScrollRaf = null;
let _dragScrollSpeed = 0;
let _tradeReviewYear = new Date().getFullYear();
let _tradeReviewOpen = false;
let _tradeReviewSort = 'oldest';
let _tradeReviewView = 'paired';
let _assetValueMode = localStorage.getItem('mp_asset_value_mode') === 'price' ? 'price' : 'valuation';

const _listCleanup = Cleanup.scope('list');
const _dragCleanup = Cleanup.scope('drag');

function renderList() {
  const container = $('#pgList');
  if (!container) return;

  _listCleanup.removeAll();

  if (_tradeReviewOpen) {
    renderTradeReviewPage(container);
    _setupListDelegation(container);
    return;
  }

  const assets = _getVisibleAssets();
  const grouped = groupBy(assets, 'category');
  const order = appState.categoryOrder;

  const allCount = appState.assets.length;
  const heldCount = filterAssetsByListTab(appState.assets, 'held').length;
  const soldCount = filterAssetsByListTab(appState.assets, 'sold').length;

  const showingSold = UIState.listFilter === 'sold';
  const summaryTotal = showingSold
    ? assets.reduce((sum, asset) => sum + calcAssetValue(asset).realizedProfit, 0)
    : calcTotal(assets);
  const heldInvestmentValues = assets
    .filter(asset => INVESTMENT_CATS.includes(asset.category) && !_isSoldOut(asset))
    .map(calcAssetValue);
  const unrealizedProfit = heldInvestmentValues.reduce((sum, value) => sum + value.profit, 0);
  const unrealizedCost = heldInvestmentValues.reduce((sum, value) => sum + value.cost, 0);
  const unrealizedPct = unrealizedCost > 0 ? (unrealizedProfit / unrealizedCost) * 100 : 0;
  const currentYear = new Date().getFullYear();
  const yearRealized = calcInvestmentTradeRows(appState.assets)
    .filter(row => row.type === 'sell' && (row.date || '').startsWith(`${currentYear}-`))
    .reduce((sum, row) => sum + row.realizedProfit, 0);

  container.innerHTML = `
    <div class="list-toolbar stagger-item" style="--i:0">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="자산 검색..."
          value="${escAttr(UIState.listSearchQuery)}" aria-label="자산 검색">
        ${UIState.listSearchQuery ? '<button class="search-clear" data-action="clear-search" aria-label="검색 초기화">✕</button>' : ''}
      </div>
      <div class="list-actions">
        <button class="btn-sm" data-action="open-trade-review">매매 결산</button>
      </div>
    </div>

    <div class="list-tabs stagger-item" style="--i:1" role="tablist" aria-label="자산 필터">
      <button class="list-tab ${UIState.listFilter === 'all' ? 'active' : ''}" role="tab"
        aria-selected="${UIState.listFilter === 'all' ? 'true' : 'false'}"
        data-action="set-list-filter" data-filter="all">전체 (${allCount})</button>
      <button class="list-tab ${UIState.listFilter === 'held' ? 'active' : ''}" role="tab"
        aria-selected="${UIState.listFilter === 'held' ? 'true' : 'false'}"
        data-action="set-list-filter" data-filter="held">보유중 (${heldCount})</button>
      <button class="list-tab ${UIState.listFilter === 'sold' ? 'active' : ''}" role="tab"
        aria-selected="${UIState.listFilter === 'sold' ? 'true' : 'false'}"
        data-action="set-list-filter" data-filter="sold">매도완료 (${soldCount})</button>
    </div>

    <div class="asset-summary stagger-item ${showingSold ? 'is-sold-summary' : ''}" style="--i:2" aria-label="자산 요약">
      <div class="asset-summary-total">
        <small>${showingSold ? '매도 완료 실현손익' : '내 자산'}</small>
        <strong class="${showingSold ? profitClass(summaryTotal) : ''}">${escHtml(fmtKRW(summaryTotal))}</strong>
        ${!showingSold && unrealizedCost > 0 ? `<span class="${profitClass(unrealizedProfit)}">평가손익 ${escHtml(fmtKRW(unrealizedProfit))} (${escHtml(fmtPct(unrealizedPct))})</span>` : ''}
      </div>
      ${!showingSold ? `<div class="asset-value-toggle" role="radiogroup" aria-label="자산 금액 표시 방식">
        <button type="button" class="${_assetValueMode === 'price' ? 'active' : ''}" data-action="set-asset-value-mode" data-mode="price" role="radio" aria-checked="${_assetValueMode === 'price'}">현재가</button>
        <button type="button" class="${_assetValueMode === 'valuation' ? 'active' : ''}" data-action="set-asset-value-mode" data-mode="valuation" role="radio" aria-checked="${_assetValueMode === 'valuation'}">평가금</button>
      </div>` : ''}
      <div class="asset-summary-meta"><span>${assets.length}개 표시 중</span><button class="asset-realized-summary ${profitClass(yearRealized)}" data-action="open-trade-review">${currentYear}년 실현손익 ${escHtml(fmtKRW(yearRealized))}</button></div>
    </div>

    <div id="assetListBody" role="list" aria-label="자산 목록">
      ${(() => {
        const prevSnap = getPreviousSnapshot();
        const pav = prevSnap ? prevSnap.byAsset || null : null;
        return order.map((catId, idx) => {
          const catAssets = grouped[catId] || [];
          if (catAssets.length === 0 && !UIState.isEditMode) return '';
          return renderListCategory(catId, catAssets, idx + 3, pav);
        }).join('');
      })()}
      ${assets.length === 0 ? `<div class="empty-state">${_emptyStateText()}</div>` : ''}
    </div>
  `;

  const searchInput = $('#searchInput');
  if (searchInput) {
    const handler = debounce(e => { UIState.listSearchQuery = e.target.value; renderList(); });
    _listCleanup.add(searchInput, 'input', handler);
  }

  $$('.legend-dot[data-color]').forEach(dot => {
    dot.style.background = dot.dataset.color;
  });

  _setupListDelegation(container);
  if (UIState.isEditMode) setupDragAndDrop();
}

function _setupListDelegation(container) {
  container.onclick = (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    _handleListAction(target, e);
  };
  container.onkeydown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target.closest('[data-action]');
    if (!target) return;
    e.preventDefault();
    _handleListAction(target, e);
  };
}

function _handleListAction(target, e) {
  const action = target.dataset.action;
  if (action === 'clear-search') clearSearch();
  else if (action === 'open-trade-review') openTradeReview();
  else if (action === 'close-trade-review') {
    _tradeReviewOpen = false;
    renderList();
  } else if (action === 'change-trade-review-year') {
    _tradeReviewYear += Number(target.dataset.delta) || 0;
    renderList();
  } else if (action === 'set-trade-review-sort') {
    _tradeReviewSort = target.dataset.sort === 'newest' ? 'newest' : 'oldest';
    renderList();
  } else if (action === 'set-trade-review-view') {
    _tradeReviewView = target.dataset.view === 'transactions' ? 'transactions' : 'paired';
    renderList();
  }
  else if (action === 'toggle-edit') toggleEditMode();
  else if (action === 'set-asset-value-mode') {
    _assetValueMode = target.dataset.mode === 'price' ? 'price' : 'valuation';
    localStorage.setItem('mp_asset_value_mode', _assetValueMode);
    renderList();
  }
  else if (action === 'open-add-asset') openAddAsset();
  else if (action === 'set-list-filter') {
    const f = target.dataset.filter;
    if (f) setListFilter(f);
  } else if (action === 'toggle-list-cat') {
    const catId = target.dataset.cat;
    if (catId) toggleListCat(catId);
  } else if (action === 'show-more') {
    const catId = target.dataset.cat;
    if (catId) showMoreAssets(catId);
  } else if (action === 'open-asset-detail') {
    const id = target.dataset.id;
    if (id) openAssetDetail(id);
  } else if (action === 'open-asset-group') {
    const id = target.dataset.id;
    if (id) openAssetGroupDetail(id);
  } else if (action === 'edit-asset') {
    e.stopPropagation();
    const id = target.dataset.id;
    if (id) openEditAsset(id);
  } else if (action === 'copy-asset') {
    e.stopPropagation();
    const id = target.dataset.id;
    if (id) openCopyAsset(id);
  } else if (action === 'delete-asset') {
    e.stopPropagation();
    const id = target.dataset.id;
    if (id) confirmDeleteAsset(id);
  } else if (action === 'move-asset-top' || action === 'move-asset-up' || action === 'move-asset-down' || action === 'move-asset-bottom') {
    e.stopPropagation();
    const id = target.dataset.id;
    if (id) moveAssetOrder(id, action.replace('move-asset-', ''));
  }
}

function openTradeReview() {
  _tradeReviewYear = new Date().getFullYear();
  _tradeReviewSort = 'oldest';
  _tradeReviewView = 'paired';
  _tradeReviewOpen = true;
  renderList();
}

function formatTradeReviewCell(value, formatter = fmtKRW) {
  return value == null || value === '' ? '-' : escHtml(formatter(value));
}

function buildTradeReviewData(year) {
  const allRows = calcInvestmentTradeRows(appState.assets);
  const rows = allRows.filter(row => (row.date || '').startsWith(`${year}-`));
  rows.sort((a, b) => {
    const dateOrder = (a.date || '').localeCompare(b.date || '');
    if (dateOrder) return _tradeReviewSort === 'newest' ? -dateOrder : dateOrder;
    if (a.type !== b.type) return a.type === 'buy' ? -1 : 1;
    const assetOrder = (a.assetName || '').localeCompare(b.assetName || '', 'ko');
    return assetOrder || a.txnIndex - b.txnIndex;
  });
  const sells = rows.filter(row => row.type === 'sell');
  const monthly = Array(12).fill(0);
  for (const row of sells) {
    const month = Number((row.date || '').slice(5, 7));
    if (month >= 1 && month <= 12) monthly[month - 1] += row.realizedProfit;
  }
  return {
    rows,
    pairs: buildTradeReviewPairs(allRows, year),
    sells,
    monthly,
    realized: sells.reduce((sum, row) => sum + row.realizedProfit, 0),
    sellGross: sells.reduce((sum, row) => sum + row.gross, 0),
    fees: rows.reduce((sum, row) => sum + row.fee, 0),
  };
}

function buildTradeReviewPairs(allRows, year) {
  const yearPrefix = `${year}-`;
  const buysById = new Map(allRows.filter(row => row.type === 'buy').map(row => [row.id, row]));
  const sells = allRows.filter(row => row.type === 'sell' && (row.date || '').startsWith(yearPrefix));
  const matchesByBuyId = new Map();
  const pairedBuyIds = new Set();
  const unmatched = [];

  for (const sell of sells) {
    const rawMatches = Array.isArray(sell.matchedBuys) && sell.matchedBuys.length
      ? sell.matchedBuys
      : (sell.matchedBuyIds || []).map(id => ({ id, qty: 0 }));
    const validMatches = rawMatches.filter(match => buysById.has(match.id));
    const matchedQty = validMatches.reduce((sum, match) => sum + safeNum(match.qty), 0);
    if (!validMatches.length) {
      unmatched.push({ buy: null, sell, allocation: null, isContinuation: false });
      continue;
    }
    validMatches.forEach((match, matchIndex) => {
      const buy = buysById.get(match.id);
      const ratio = matchedQty > 0 ? safeNum(match.qty) / matchedQty : 1 / validMatches.length;
      const allocation = {
        qty: matchedQty > 0 ? safeNum(match.qty) : safeNum(sell.qty) * ratio,
        gross: safeNum(sell.gross) * ratio,
        fee: safeNum(sell.fee) * ratio,
        netAmount: safeNum(sell.netAmount) * ratio,
        realizedProfit: safeNum(sell.realizedProfit) * ratio,
        costBasis: safeNum(sell.costBasis) * ratio,
        realizedPct: safeNum(sell.costBasis) * ratio > 0
          ? (safeNum(sell.realizedProfit) * ratio / (safeNum(sell.costBasis) * ratio)) * 100
          : 0,
      };
      const entries = matchesByBuyId.get(match.id) || [];
      entries.push({ buy, sell, allocation, isContinuation: entries.length > 0, isSplitSell: validMatches.length > 1, matchIndex });
      matchesByBuyId.set(match.id, entries);
      pairedBuyIds.add(match.id);
    });
  }

  const pairs = [];
  const relevantBuys = allRows.filter(row => row.type === 'buy' && (
    (row.date || '').startsWith(yearPrefix) || pairedBuyIds.has(row.id)
  ));
  for (const buy of relevantBuys) {
    const matches = (matchesByBuyId.get(buy.id) || []).sort((a, b) => (a.sell.date || '').localeCompare(b.sell.date || ''));
    if (matches.length) pairs.push(...matches);
    else pairs.push({ buy, sell: null, allocation: null, isContinuation: false });
  }
  pairs.push(...unmatched);
  pairs.sort((a, b) => {
    const aDate = a.buy?.date || a.sell?.date || '';
    const bDate = b.buy?.date || b.sell?.date || '';
    const order = aDate.localeCompare(bDate) || (a.sell?.date || '').localeCompare(b.sell?.date || '');
    return _tradeReviewSort === 'newest' ? -order : order;
  });
  return pairs;
}

function renderTradeReviewRow(row, index, rowIndexById) {
  const isSell = row.type === 'sell';
  const holding = isSell && row.holdingDays != null ? `${row.holdingDays}일` : '-';
  const fullySold = !isSell && row.qty > 0 && row.remainingQty <= 1e-9;
  const partiallySold = !isSell && row.soldQty > 1e-9 && row.remainingQty > 1e-9;
  const linkedRows = isSell
    ? row.matchedBuyIds.map(id => rowIndexById.get(id)).filter(Number.isFinite).map(number => `#${number + 1}`)
    : [];
  const status = isSell
    ? (linkedRows.length ? `매수 ${linkedRows.join(', ')} 연결` : '연결 매수 없음')
    : fullySold ? '전량 매도'
      : partiallySold ? `일부 매도 · 잔여 ${fmtNum(row.remainingQty, row.remainingQty % 1 ? 4 : 0)}`
        : `보유 ${fmtNum(row.remainingQty, row.remainingQty % 1 ? 4 : 0)}`;
  const rowClass = [isSell ? 'is-sell' : 'is-buy', fullySold ? 'is-closed-buy' : '', partiallySold ? 'is-partial-buy' : ''].filter(Boolean).join(' ');
  return `<tr class="${rowClass}">
    <td>${index + 1}</td>
    <td>${row.account ? escHtml(row.account) : '-'}</td>
    <td>${row.stockCode ? escHtml(row.stockCode) : '-'}</td>
    <th scope="row">${escHtml(row.assetName)}</th>
    <td><span class="trade-type-badge ${row.type}">${isSell ? '매도' : '매수'}</span></td>
    <td><span class="trade-link-status ${fullySold ? 'closed' : partiallySold ? 'partial' : isSell ? 'linked' : 'held'}">${escHtml(status)}</span></td>
    <td>${escHtml(row.date)}</td>
    <td>${isSell && row.buyDate ? escHtml(row.buyDate) : '-'}</td>
    <td>${formatTradeReviewCell(row.price, value => fmtNum(value, 0))}</td>
    <td>${formatTradeReviewCell(row.qty, value => fmtNum(value, value % 1 ? 4 : 0))}</td>
    <td>${formatTradeReviewCell(row.gross)}</td>
    <td>${formatTradeReviewCell(row.currentPrice, value => fmtNum(value, 0))}</td>
    <td>${row.fee ? formatTradeReviewCell(row.fee) : '-'}</td>
    <td>${formatTradeReviewCell(row.netAmount)}</td>
    <td class="${isSell ? profitClass(row.realizedProfit) : ''}">${isSell ? formatTradeReviewCell(row.realizedProfit) : '-'}</td>
    <td class="${isSell ? profitClass(row.realizedProfit) : ''}">${isSell ? escHtml(fmtPct(row.realizedPct)) : '-'}</td>
    <td>${holding}</td>
    <td class="trade-review-memo">${row.memo ? escHtml(row.memo) : '-'}</td>
  </tr>`;
}

function renderPairedTradeReviewRow(pair, index) {
  const { buy, sell, allocation } = pair;
  const fullySold = buy && buy.qty > 0 && buy.remainingQty <= 1e-9;
  const partiallySold = buy && buy.soldQty > 1e-9 && buy.remainingQty > 1e-9;
  const status = !buy ? '연결 매수 없음'
    : fullySold ? '전량 매도'
      : partiallySold ? `일부 매도 · 잔여 ${fmtNum(buy.remainingQty, buy.remainingQty % 1 ? 4 : 0)}`
        : `보유 ${fmtNum(buy.remainingQty, buy.remainingQty % 1 ? 4 : 0)}`;
  const sellQty = allocation ? allocation.qty : null;
  const sellGross = allocation ? allocation.gross : null;
  const sellFee = allocation ? allocation.fee : null;
  const sellNet = allocation ? allocation.netAmount : null;
  const realizedProfit = allocation ? allocation.realizedProfit : null;
  const realizedPct = allocation ? allocation.realizedPct : null;
  const holdingDays = buy && sell && isValidDate(buy.date) && isValidDate(sell.date)
    ? Math.max(0, Math.floor((new Date(sell.date).getTime() - new Date(buy.date).getTime()) / 86400000))
    : null;
  const rowClass = [
    'trade-paired-row',
    fullySold ? 'is-closed-buy' : '',
    partiallySold ? 'is-partial-buy' : '',
    pair.isContinuation ? 'is-continuation' : '',
  ].filter(Boolean).join(' ');
  const splitLabel = pair.isSplitSell ? '<span class="trade-split-label">분할 연결</span>' : '';
  return `<tr class="${rowClass}">
    <td>${index + 1}</td>
    <td>${buy?.account || sell?.account ? escHtml(buy?.account || sell?.account) : '-'}</td>
    <td>${buy?.stockCode || sell?.stockCode ? escHtml(buy?.stockCode || sell?.stockCode) : '-'}</td>
    <th scope="row">${buy?.assetName || sell?.assetName ? escHtml(buy?.assetName || sell?.assetName) : '-'}</th>
    <td><span class="trade-link-status ${!buy ? 'linked' : fullySold ? 'closed' : partiallySold ? 'partial' : 'held'}">${escHtml(status)}</span>${splitLabel}</td>
    <td>${buy ? escHtml(buy.date) : '-'}</td>
    <td>${buy ? formatTradeReviewCell(buy.price, value => fmtNum(value, 0)) : '-'}</td>
    <td>${buy ? formatTradeReviewCell(buy.qty, value => fmtNum(value, value % 1 ? 4 : 0)) : '-'}</td>
    <td>${buy ? formatTradeReviewCell(buy.gross) : '-'}</td>
    <td>${sell ? escHtml(sell.date) : '-'}</td>
    <td>${sell ? formatTradeReviewCell(sell.price, value => fmtNum(value, 0)) : '-'}</td>
    <td>${sellQty == null ? '-' : formatTradeReviewCell(sellQty, value => fmtNum(value, value % 1 ? 4 : 0))}</td>
    <td>${sellGross == null ? '-' : formatTradeReviewCell(sellGross)}</td>
    <td>${sellFee ? formatTradeReviewCell(sellFee) : '-'}</td>
    <td>${sellNet == null ? '-' : formatTradeReviewCell(sellNet)}</td>
    <td class="${sell ? profitClass(realizedProfit) : ''}">${sell ? formatTradeReviewCell(realizedProfit) : '-'}</td>
    <td class="${sell ? profitClass(realizedProfit) : ''}">${sell ? escHtml(fmtPct(realizedPct)) : '-'}</td>
    <td>${holdingDays == null ? '-' : `${holdingDays}일`}</td>
    <td class="trade-review-memo">${sell?.memo || buy?.memo ? escHtml(sell?.memo || buy?.memo) : '-'}</td>
  </tr>`;
}

function renderTradeReviewPage(container) {
  const data = buildTradeReviewData(_tradeReviewYear);
  const rowIndexById = new Map(data.rows.map((row, index) => [row.id, index]));
  container.innerHTML = `
    <section class="trade-review-page page-enter" aria-label="매매 결산">
      <div class="trade-review-page-header">
        <button class="btn-sm trade-review-back" data-action="close-trade-review" aria-label="자산 목록으로 돌아가기">← 자산 목록</button>
        <div>
          <h2>매매 결산</h2>
          <p>월별 실현손익과 전체 매매 기록을 확인하세요.</p>
        </div>
      </div>
      <div class="card trade-review-page-card">
        <div class="trade-review-toolbar">
          <button class="btn-icon" data-action="change-trade-review-year" data-delta="-1" aria-label="이전 연도">◀</button>
          <strong>${_tradeReviewYear}년</strong>
          <button class="btn-icon" data-action="change-trade-review-year" data-delta="1" aria-label="다음 연도">▶</button>
        </div>
        <div class="trade-review-sort" role="radiogroup" aria-label="매매 기록 정렬">
          <button class="btn-sm ${_tradeReviewSort === 'oldest' ? 'active' : ''}" data-action="set-trade-review-sort" data-sort="oldest"
            role="radio" aria-checked="${_tradeReviewSort === 'oldest'}">오래된 날짜순</button>
          <button class="btn-sm ${_tradeReviewSort === 'newest' ? 'active' : ''}" data-action="set-trade-review-sort" data-sort="newest"
            role="radio" aria-checked="${_tradeReviewSort === 'newest'}">최신 날짜순</button>
        </div>
        <div class="trade-review-view" role="radiogroup" aria-label="매매 결산 보기 방식">
          <button class="btn-sm ${_tradeReviewView === 'paired' ? 'active' : ''}" data-action="set-trade-review-view" data-view="paired"
            role="radio" aria-checked="${_tradeReviewView === 'paired'}">매수·매도 연결 보기</button>
          <button class="btn-sm ${_tradeReviewView === 'transactions' ? 'active' : ''}" data-action="set-trade-review-view" data-view="transactions"
            role="radio" aria-checked="${_tradeReviewView === 'transactions'}">전체 거래 날짜순 보기</button>
        </div>
        <div class="trade-review-summary">
          <div><span>연간 실현손익</span><strong class="${profitClass(data.realized)}">${escHtml(fmtKRW(data.realized))}</strong></div>
          <div><span>총 매도금액</span><strong>${escHtml(fmtKRW(data.sellGross))}</strong></div>
          <div><span>총 수수료·세금</span><strong>${escHtml(fmtKRW(data.fees))}</strong></div>
          <div><span>매도 건수</span><strong>${data.sells.length}건</strong></div>
        </div>
        <div class="trade-review-months" aria-label="월별 실현손익">
          ${data.monthly.map((value, index) => `<div><span>${index + 1}월</span><strong class="${profitClass(value)}">${value ? escHtml(fmtKRW(value)) : '-'}</strong></div>`).join('')}
        </div>
        <div class="trade-review-note">${_tradeReviewView === 'paired'
          ? '매수한 줄에 연결된 매도 내역을 함께 표시합니다. 실현손익은 이동평균 매수원가 기준이며 수수료와 세금을 차감합니다.'
          : '실현손익은 이동평균 매수원가를 기준으로 계산하며, 입력한 수수료와 세금을 차감합니다.'}</div>
        <div class="trade-review-table-wrap">
          ${_tradeReviewView === 'paired' ? `
            <table class="trade-review-table trade-review-paired-table">
              <thead><tr><th>순번</th><th>계좌</th><th>종목코드</th><th>종목명</th><th>상태</th><th>매수일</th><th>매수가</th><th>매수수량</th><th>총 매수금액</th><th>매도일</th><th>매도가</th><th>매도수량</th><th>총 매도금액</th><th>수수료·세금</th><th>비용 제외 매도금액</th><th>실현손익</th><th>수익률</th><th>보유기간</th><th>비고</th></tr></thead>
              <tbody>${data.pairs.length ? data.pairs.map((pair, index) => renderPairedTradeReviewRow(pair, index)).join('') : '<tr><td colspan="19" class="trade-review-empty">해당 연도의 매매 기록이 없습니다.</td></tr>'}</tbody>
            </table>` : `
            <table class="trade-review-table">
              <thead><tr><th>순번</th><th>계좌</th><th>종목코드</th><th>종목명</th><th>구분</th><th>상태/연결</th><th>거래일</th><th>매수기준일</th><th>거래단가</th><th>수량</th><th>총 거래금액</th><th>현재가</th><th>수수료·세금</th><th>비용 포함/제외</th><th>실현손익</th><th>수익률</th><th>보유기간</th><th>비고</th></tr></thead>
              <tbody>${data.rows.length ? data.rows.map((row, index) => renderTradeReviewRow(row, index, rowIndexById)).join('') : '<tr><td colspan="18" class="trade-review-empty">해당 연도의 매매 기록이 없습니다.</td></tr>'}</tbody>
            </table>`}
        </div>
      </div>
    </section>`;
}

function filterAssets(assets, query) {
  if (!query) return assets;
  const q = query.toLowerCase();
  return assets.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.category.includes(q) ||
    (a.stockCode && a.stockCode.toLowerCase().includes(q)) ||
    (a.note && a.note.toLowerCase().includes(q))
  );
}

// Cycle C (C-15): 보유중/매도완료 분류
// 매도완료 = 투자형 카테고리 + 거래 있음 + 현재 수량 사실상 0 + USDT 아님
function _isSoldOut(asset) {
  if (!INVESTMENT_CATS.includes(asset.category)) return false;
  if (asset.isUsdt) return false;
  if (!Array.isArray(asset.txns) || asset.txns.length === 0) return false;
  const v = calcAssetValue(asset);
  return v.qty < 1e-9;
}

function filterAssetsByListTab(assets, filter) {
  if (filter === 'all') return assets;
  if (filter === 'sold') return assets.filter(a => _isSoldOut(a));
  // 'held' = 매도완료가 아닌 모든 자산 (비투자형 자산은 항상 보유중에 포함)
  return assets.filter(a => !_isSoldOut(a));
}

function _getVisibleAssets() {
  const tabFiltered = filterAssetsByListTab(appState.assets, UIState.listFilter);
  return filterAssets(tabFiltered, UIState.listSearchQuery);
}

function _emptyStateText() {
  if (UIState.listSearchQuery) return '검색 결과가 없습니다';
  if (UIState.listFilter === 'sold') return '매도완료된 자산이 없습니다';
  if (UIState.listFilter === 'held') return '보유 중인 자산이 없습니다';
  return '자산이 없습니다';
}

function setListFilter(filter) {
  if (UIState.listFilter === filter) return;
  UIState.listFilter = filter;
  // 매도완료 탭으로 전환 시 편집 모드 자동 해제
  if (filter === 'sold' && UIState.isEditMode) UIState.isEditMode = false;
  renderList();
  renderFAB();
}

function clearSearch() {
  UIState.listSearchQuery = '';
  renderList();
}

function toggleEditMode() {
  UIState.isEditMode = !UIState.isEditMode;
  renderList();
  renderFAB();
}

function getAssetGroupKey(asset) {
  if (!asset || !INVESTMENT_CATS.includes(asset.category)) return `asset:${asset?.id || ''}`;
  const code = String(asset.stockCode || '').trim().toUpperCase();
  if (code) return `stock:${asset.category}:${asset.market || ''}:${code}`;
  const coinId = String(asset.coinId || '').trim().toLowerCase();
  if (coinId) return `coin:${coinId}`;
  return `name:${asset.category}:${String(asset.name || '').trim().toLowerCase()}`;
}

function getAssetGroupMembers(asset) {
  if (!asset) return [];
  const key = getAssetGroupKey(asset);
  return appState.assets.filter(candidate => getAssetGroupKey(candidate) === key);
}

function _buildListAssetGroups(assets) {
  if (UIState.isEditMode) return assets.map(asset => ({ key: `asset:${asset.id}`, assets: [asset] }));
  const groups = new Map();
  for (const asset of assets) {
    const key = getAssetGroupKey(asset);
    if (!groups.has(key)) groups.set(key, { key, assets: [] });
    groups.get(key).assets.push(asset);
  }
  return [...groups.values()];
}

function calcAssetGroupValue(groupAssets) {
  const all = Array.isArray(groupAssets) ? groupAssets : [];
  const held = all.filter(asset => !_isSoldOut(asset));
  const sold = all.filter(asset => _isSoldOut(asset));
  const values = held.map(asset => ({ asset, value: calcAssetValue(asset) }));
  const latest = values.slice().sort((a, b) => {
    const aTime = Date.parse(a.asset.lpu || '') || 0;
    const bTime = Date.parse(b.asset.lpu || '') || 0;
    return bTime - aTime;
  })[0];
  const price = safeNum(latest?.value.price);
  const qty = values.reduce((sum, item) => sum + item.value.qty, 0);
  const cost = values.reduce((sum, item) => sum + item.value.cost, 0);
  const value = price > 0 ? price * qty : values.reduce((sum, item) => sum + item.value.value, 0);
  const profit = value - cost;
  const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
  const avgPrice = qty > 0 ? cost / qty : 0;
  const realizedProfit = all.reduce((sum, asset) => sum + calcAssetValue(asset).realizedProfit, 0);
  return { held, sold, price, qty, cost, value, profit, profitPct, avgPrice, realizedProfit };
}

function renderListAssetGroup(group, prevAssetValues) {
  if (!group || group.assets.length <= 1) return renderListAsset(group?.assets?.[0], prevAssetValues);
  const representative = group.assets.find(asset => !_isSoldOut(asset)) || group.assets[0];
  const data = calcAssetGroupValue(group.assets);
  const hasHeld = data.held.length > 0;
  const unit = representative.category === '코인' ? '개' : '주';
  const code = representative.stockCode || '';
  const subParts = [];
  if (hasHeld) subParts.push(`${fmtNum(data.qty, data.qty % 1 !== 0 ? 4 : 0)}${unit}`, `보유내역 ${data.held.length}건`);
  if (data.sold.length) subParts.push(`매도완료 ${data.sold.length}건`);
  return `<div class="list-asset asset-stock-group" data-action="open-asset-group" data-id="${escAttr(representative.id)}"
      role="listitem" tabindex="0" aria-label="${escAttr(representative.name)} 묶음: 보유 ${data.held.length}건, 매도완료 ${data.sold.length}건">
    <div class="asset-main">
      <div class="asset-name">${escHtml(representative.name)}<span class="asset-group-count">${group.assets.length}건</span>${code ? `<span class="asset-code">${escHtml(code)}</span>` : ''}</div>
      <div class="asset-sub">${escHtml(subParts.join(' · '))}</div>
    </div>
    <div class="asset-values">
      ${hasHeld ? (_assetValueMode === 'price' ? `
        <div class="asset-value-label">현재가</div>
        <div class="asset-value">${escHtml(fmtPrice(data.price))}</div>
        <div class="asset-profit asset-average">내 평단 ${escHtml(fmtPrice(data.avgPrice))}</div>
      ` : `
        <div class="asset-value-label">평가금액</div>
        <div class="asset-value">${escHtml(fmtKRW(data.value))}</div>
        <div class="asset-profit ${profitClass(data.profit)}">${escHtml(fmtKRW(data.profit))} (${escHtml(fmtPct(data.profitPct))})</div>
      `) : `
        <div class="asset-value-label">실현손익</div>
        <div class="asset-value ${profitClass(data.realizedProfit)}">${escHtml(fmtKRW(data.realizedProfit))}</div>
      `}
    </div>
    <span class="asset-group-chevron" aria-hidden="true">›</span>
  </div>`;
}

function renderListCategory(catId, assets, staggerIdx = 2, prevAssetValues = null) {
  const cat = CAT_MAP[catId];
  const isOpen = UIState.listCategoryOpen[catId] !== false;
  const showingSold = UIState.listFilter === 'sold';
  const total = assets.reduce((s, a) => {
    const value = calcAssetValue(a);
    return s + (showingSold ? value.realizedProfit : value.value);
  }, 0);
  const groupedAssets = _buildListAssetGroups(assets);
  const shownCount = UIState.listCategoryShown[catId] || LAZY_RENDER_THRESHOLD;
  const visibleGroups = groupedAssets.slice(0, shownCount);
  const hasMore = groupedAssets.length > shownCount;
  const countLabel = groupedAssets.length === assets.length ? `${assets.length}` : `${groupedAssets.length}종목 · ${assets.length}건`;

  return `
    <div class="list-cat stagger-item" style="--i:${staggerIdx}" id="listCat-${escAttr(catId)}" data-cat="${escAttr(catId)}"
      ${UIState.isEditMode ? 'draggable="true"' : ''} role="listitem">
      <div class="list-cat-header" data-action="toggle-list-cat" data-cat="${escAttr(catId)}"
        role="button" tabindex="0" aria-expanded="${isOpen}">
        ${UIState.isEditMode ? '<span class="drag-handle cat-drag" aria-label="카테고리 드래그">⠿</span>' : ''}
        <span class="cat-icon" aria-hidden="true">${cat.icon}</span>
        <span class="cat-name">${escHtml(cat.label)} (${countLabel})</span>
        <span class="cat-total ${showingSold ? profitClass(total) : ''}">${showingSold ? '실현손익 ' : ''}${escHtml(fmtKRW(total))}</span>
        <span class="chevron ${isOpen ? 'open' : ''}" aria-hidden="true">▸</span>
      </div>
      ${isOpen ? `
        <div class="list-cat-body" role="list">
          ${visibleGroups.length > 0
            ? visibleGroups.map(group => renderListAssetGroup(group, prevAssetValues)).join('')
            : '<div class="empty-cat">자산이 없습니다</div>'}
          ${hasMore ? `
            <button class="btn-sm show-more-btn" data-action="show-more" data-cat="${escAttr(catId)}"
              aria-label="${escAttr(cat.label)} 종목 더 보기 (${groupedAssets.length - shownCount}개 남음)">
              더 보기 (${groupedAssets.length - shownCount}개 남음)
            </button>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function showMoreAssets(catId) {
  const oldShown = UIState.listCategoryShown[catId] || LAZY_RENDER_THRESHOLD;
  const newShown = oldShown + LAZY_RENDER_PAGE;
  UIState.listCategoryShown[catId] = newShown;

  const section = $(`#listCat-${catId}`);
  if (!section) { renderList(); return; }
  const body = section.querySelector('.list-cat-body');
  if (!body) { renderList(); return; }

  const assets = _getVisibleAssets().filter(a => a.category === catId);
  const groupedAssets = _buildListAssetGroups(assets);
  const newItems = groupedAssets.slice(oldShown, newShown);
  const hasMore = groupedAssets.length > newShown;
  const cat = CAT_MAP[catId];

  const oldBtn = body.querySelector('.show-more-btn');
  if (oldBtn) oldBtn.remove();

  const prevSnap = getPreviousSnapshot();
  const prevAssetValues = prevSnap ? prevSnap.byAsset || null : null;
  const fragment = document.createDocumentFragment();
  for (const group of newItems) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderListAssetGroup(group, prevAssetValues);
    while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
  }
  body.appendChild(fragment);

  if (hasMore) {
    const btnWrapper = document.createElement('div');
    btnWrapper.innerHTML = `
      <button class="btn-sm show-more-btn" data-action="show-more" data-cat="${escAttr(catId)}"
        aria-label="${escAttr(cat.label)} 종목 더 보기 (${groupedAssets.length - newShown}개 남음)">
        더 보기 (${groupedAssets.length - newShown}개 남음)
      </button>
    `;
    body.appendChild(btnWrapper.firstElementChild);
  }

  if (UIState.isEditMode) setupDragAndDrop();
}

function _assetOrderMeta(asset) {
  const siblings = appState.assets.filter(a => a.category === asset.category);
  return {
    index: siblings.findIndex(a => a.id === asset.id),
    count: siblings.length,
  };
}

function _renderAssetMoveActions(asset) {
  const meta = _assetOrderMeta(asset);
  const atTop = meta.index <= 0;
  const atBottom = meta.index < 0 || meta.index >= meta.count - 1;
  const disabledAll = meta.count <= 1 || meta.index < 0;
  const name = escAttr(asset.name);
  const id = escAttr(asset.id);
  return `
    <div class="asset-order-actions" aria-label="${name} 순서 변경">
      <button class="btn-icon order-btn" data-action="move-asset-top" data-id="${id}" draggable="false"
        aria-label="${name} 맨 위로 이동" title="맨 위로 이동" ${disabledAll || atTop ? 'disabled' : ''}>⇧</button>
      <button class="btn-icon order-btn" data-action="move-asset-up" data-id="${id}" draggable="false"
        aria-label="${name} 한 칸 위로 이동" title="한 칸 위로 이동" ${disabledAll || atTop ? 'disabled' : ''}>↑</button>
      <button class="btn-icon order-btn" data-action="move-asset-down" data-id="${id}" draggable="false"
        aria-label="${name} 한 칸 아래로 이동" title="한 칸 아래로 이동" ${disabledAll || atBottom ? 'disabled' : ''}>↓</button>
      <button class="btn-icon order-btn" data-action="move-asset-bottom" data-id="${id}" draggable="false"
        aria-label="${name} 맨 아래로 이동" title="맨 아래로 이동" ${disabledAll || atBottom ? 'disabled' : ''}>⇩</button>
    </div>
  `;
}

function renderListAsset(asset, prevAssetValues) {
  const v = calcAssetValue(asset);
  const isInv = INVESTMENT_CATS.includes(asset.category);
  const isSold = _isSoldOut(asset);
  const hasProfit = isInv && v.cost > 0 && !isSold;
  const deltaBadge = _renderAssetDeltaBadge(asset, v.value, prevAssetValues);
  const assetId = escAttr(asset.id);

  return `
    <div class="list-asset ${UIState.isEditMode ? 'list-asset-editing' : ''}" data-id="${assetId}" data-cat="${escAttr(asset.category)}"
      ${UIState.isEditMode ? 'draggable="true"' : ''}
      ${UIState.isEditMode ? '' : `data-action="open-asset-detail" data-id="${assetId}"`}
      role="listitem" tabindex="0"
      aria-label="${escAttr(asset.name)}: ${isSold ? `실현손익 ${fmtKRW(v.realizedProfit)}` : fmtKRW(v.value)}">
      ${UIState.isEditMode ? '<span class="drag-handle" aria-label="드래그">⠿</span>' : ''}
      <div class="asset-main">
        <div class="asset-name">
          ${escHtml(asset.name)}${deltaBadge}
          ${asset.stockCode ? `<span class="asset-code">${escHtml(asset.stockCode)}</span>` : ''}
        </div>
        <div class="asset-sub">
          ${isInv && v.qty > 0 ? `${escHtml(fmtNum(v.qty, v.qty % 1 !== 0 ? 4 : 0))}${asset.category === '코인' ? '개' : '주'}` : ''}
          ${asset.lpu ? `${isInv && v.qty > 0 ? '· ' : ''}${escHtml(fmtRelTime(asset.lpu))}` : ''}
        </div>
      </div>
      <div class="asset-values">
        ${isSold ? `
          <div class="asset-value-label">실현손익</div>
          <div class="asset-value ${profitClass(v.realizedProfit)}">${escHtml(fmtKRW(v.realizedProfit))}</div>
          <div class="asset-profit ${profitClass(v.realizedProfit)}">${escHtml(fmtPct(v.realizedPct))}</div>
        ` : `
          ${isInv && v.qty > 0 && _assetValueMode === 'price' ? `
            <div class="asset-value-label">현재가</div>
            <div class="asset-value">${escHtml(fmtPrice(v.price))}</div>
            <div class="asset-profit asset-average">내 평단 ${escHtml(fmtPrice(v.avgPrice))}</div>
          ` : `
            ${isInv && v.qty > 0 ? '<div class="asset-value-label">평가금액</div>' : ''}
            <div class="asset-value">${escHtml(fmtKRW(v.value))}</div>
            ${hasProfit ? `<div class="asset-profit ${profitClass(v.profit)}">${escHtml(fmtKRW(v.profit))} (${escHtml(fmtPct(v.profitPct))})</div>` : ''}
          `}
        `}
      </div>
      ${UIState.isEditMode ? `
        <div class="edit-actions" draggable="false">
          ${_renderAssetMoveActions(asset)}
          <button class="btn-icon" data-action="copy-asset" data-id="${assetId}" draggable="false" aria-label="${escAttr(asset.name)} 복사해서 추가" title="복사해서 추가">⧉</button>
          <button class="btn-icon" data-action="edit-asset" data-id="${assetId}" draggable="false" aria-label="${escAttr(asset.name)} 수정">✎</button>
          <button class="btn-icon btn-danger" data-action="delete-asset" data-id="${assetId}" draggable="false" aria-label="${escAttr(asset.name)} 삭제">🗑</button>
        </div>
      ` : ''}
    </div>
  `;
}

function toggleListCat(catId) {
  const newOpen = UIState.listCategoryOpen[catId] === false ? true : false;
  UIState.listCategoryOpen[catId] = newOpen;

  const section = $(`#listCat-${catId}`);
  if (!section) { renderList(); return; }

  const header = section.querySelector('.list-cat-header');
  if (header) {
    header.setAttribute('aria-expanded', String(newOpen));
    const chevron = header.querySelector('.chevron');
    if (chevron) chevron.classList.toggle('open', newOpen);
  }

  const existingBody = section.querySelector('.list-cat-body');
  if (newOpen) {
    if (!existingBody) {
      const assets = _getVisibleAssets().filter(a => a.category === catId);
      const groupedAssets = _buildListAssetGroups(assets);
      const shownCount = UIState.listCategoryShown[catId] || LAZY_RENDER_THRESHOLD;
      const visibleGroups = groupedAssets.slice(0, shownCount);
      const hasMore = groupedAssets.length > shownCount;
      const cat = CAT_MAP[catId];

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'list-cat-body';
      bodyDiv.setAttribute('role', 'list');
      const prevSnap = getPreviousSnapshot();
      const prevAssetValues = prevSnap ? prevSnap.byAsset || null : null;
      bodyDiv.innerHTML = `
        ${visibleGroups.length > 0
          ? visibleGroups.map(group => renderListAssetGroup(group, prevAssetValues)).join('')
          : '<div class="empty-cat">자산이 없습니다</div>'}
        ${hasMore ? `
          <button class="btn-sm show-more-btn" data-action="show-more" data-cat="${escAttr(catId)}"
            aria-label="${escAttr(cat.label)} 종목 더 보기 (${groupedAssets.length - shownCount}개 남음)">
            더 보기 (${groupedAssets.length - shownCount}개 남음)
          </button>
        ` : ''}
      `;
      section.appendChild(bodyDiv);
      if (UIState.isEditMode) setupDragAndDrop();
    }
  } else {
    if (existingBody) existingBody.remove();
  }
}

// ── Drag & Drop ──
// v4.4.1: 처음부터 재작성
//  - 데스크톱: 행 어디서든 드래그 시작 (핸들 gate 제거, .edit-actions는 draggable=false로 차단됨)
//  - 모바일: .drag-handle 터치만 드래그 시작 (히트영역 44px CSS로 확대)
//  - 삽입선 피드백: 타겟 상/하반부 판정 → drag-over-top / drag-over-bottom
//  - window.__dragInProgress 전역 플래그: app.js 스와이프 핸들러가 이를 보고 bail
//  - 카테고리 dragstart도 stopPropagation
function setupDragAndDrop() {
  _dragCleanup.removeAll();

  // ── Asset rows ──
  $$('.list-asset[draggable]').forEach(el => {
    _dragCleanup.add(el, 'dragstart', e => {
      e.stopPropagation();
      _dragAssetId = el.dataset.id;
      _dragCatName = el.dataset.cat;
      _dragInsertBefore = false;
      el.classList.add('dragging');
      window.__dragInProgress = true;
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(_dragAssetId));
      } catch (_) { /* Safari quirk */ }
    });

    _dragCleanup.add(el, 'dragend', () => {
      el.classList.remove('dragging');
      _clearDragOverClasses();
      _stopDragAutoScroll();
      _dragAssetId = null;
      _dragCatName = null;
      _dragInsertBefore = false;
      setTimeout(() => { window.__dragInProgress = false; }, 50);
    });

    _dragCleanup.add(el, 'dragover', e => {
      if (!_dragAssetId || el.dataset.cat !== _dragCatName) return;
      if (el.dataset.id === _dragAssetId) return;
      e.preventDefault();
      _updateDragAutoScroll(e.clientY);
      e.dataTransfer.dropEffect = 'move';
      const rect = el.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      _dragInsertBefore = before;
      _clearDragOverClasses();
      el.classList.add(before ? 'drag-over-top' : 'drag-over-bottom');
    });

    _dragCleanup.add(el, 'dragleave', e => {
      if (e.currentTarget === el && !el.contains(e.relatedTarget)) {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      }
    });

    _dragCleanup.add(el, 'drop', e => {
      e.preventDefault();
      e.stopPropagation();
      _clearDragOverClasses();
      const targetId = el.dataset.id;
      if (_dragAssetId && _dragAssetId !== targetId && el.dataset.cat === _dragCatName) {
        onReorderAsset(_dragAssetId, targetId, _dragInsertBefore);
      }
    });
  });

  // ── Category rows ──
  $$('.list-cat[draggable]').forEach(el => {
    _dragCleanup.add(el, 'dragstart', e => {
      // 안전장치: 내부 asset에서 시작한 dragstart가 버블링된 경우 차단
      if (e.target.closest('.list-asset')) { e.preventDefault(); return; }
      e.stopPropagation();
      _dragAssetId = null;
      _dragCatName = el.dataset.cat;
      _dragInsertBefore = false;
      el.classList.add('dragging');
      window.__dragInProgress = true;
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(_dragCatName));
      } catch (_) {}
    });

    _dragCleanup.add(el, 'dragend', () => {
      el.classList.remove('dragging');
      _clearDragOverClasses();
      _stopDragAutoScroll();
      _dragCatName = null;
      _dragInsertBefore = false;
      setTimeout(() => { window.__dragInProgress = false; }, 50);
    });

    _dragCleanup.add(el, 'dragover', e => {
      if (_dragAssetId) return; // asset 드래그 중엔 카테고리 하이라이트 금지
      if (!_dragCatName || el.dataset.cat === _dragCatName) return;
      e.preventDefault();
      _updateDragAutoScroll(e.clientY);
      e.dataTransfer.dropEffect = 'move';
      const rect = el.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      _dragInsertBefore = before;
      _clearDragOverClasses();
      el.classList.add(before ? 'drag-over-top' : 'drag-over-bottom');
    });

    _dragCleanup.add(el, 'dragleave', e => {
      if (e.currentTarget === el && !el.contains(e.relatedTarget)) {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      }
    });

    _dragCleanup.add(el, 'drop', e => {
      e.preventDefault();
      e.stopPropagation();
      _clearDragOverClasses();
      const targetCat = el.dataset.cat;
      if (_dragCatName && !_dragAssetId && _dragCatName !== targetCat) {
        onReorderCategory(_dragCatName, targetCat, _dragInsertBefore);
      }
    });
  });

  _dragCleanup.add(document, 'dragover', e => {
    if (!_dragAssetId && !_dragCatName) return;
    _updateDragAutoScroll(e.clientY);
  });
  _dragCleanup.add(document, 'drop', _stopDragAutoScroll);

  setupTouchDrag();
}

function _clearDragOverClasses() {
  $$('.drag-over-top, .drag-over-bottom, .drag-over').forEach(d => {
    d.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over');
  });
}

function _updateDragAutoScroll(clientY) {
  const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!viewportH) return;
  const edge = 88;
  const maxSpeed = 18;
  let speed = 0;
  if (clientY < edge) {
    speed = -Math.ceil(((edge - Math.max(0, clientY)) / edge) * maxSpeed);
  } else if (viewportH - clientY < edge) {
    speed = Math.ceil(((edge - Math.max(0, viewportH - clientY)) / edge) * maxSpeed);
  }
  _dragScrollSpeed = speed;
  if (speed && !_dragScrollRaf) _dragScrollRaf = requestAnimationFrame(_runDragAutoScroll);
  if (!speed && _dragScrollRaf) _stopDragAutoScroll();
}

function _runDragAutoScroll() {
  if (!_dragScrollSpeed) {
    _dragScrollRaf = null;
    return;
  }
  window.scrollBy(0, _dragScrollSpeed);
  _dragScrollRaf = requestAnimationFrame(_runDragAutoScroll);
}

function _stopDragAutoScroll() {
  _dragScrollSpeed = 0;
  if (_dragScrollRaf) {
    cancelAnimationFrame(_dragScrollRaf);
    _dragScrollRaf = null;
  }
}

// ── Touch Drag (mobile) ──
function setupTouchDrag() {
  const touchMoveHandler = e => {
    if (!_touchClone) return;
    e.preventDefault();
    const t = e.touches[0];
    _updateDragAutoScroll(t.clientY);
    positionGhost(t);
    const elBelow = document.elementFromPoint(t.clientX, t.clientY);
    const target = elBelow?.closest('.list-asset, .list-cat');
    _clearDragOverClasses();
    if (!target || target === _touchDragEl) return;
    if (_touchDragEl.classList.contains('list-asset')) {
      if (!target.classList.contains('list-asset')) return;
      if (target.dataset.cat !== _touchDragEl.dataset.cat) return;
    } else if (_touchDragEl.classList.contains('list-cat')) {
      if (!target.classList.contains('list-cat')) return;
      if (target.dataset.cat === _touchDragEl.dataset.cat) return;
    }
    const rect = target.getBoundingClientRect();
    const before = (t.clientY - rect.top) < rect.height / 2;
    _touchInsertBefore = before;
    target.classList.add(before ? 'drag-over-top' : 'drag-over-bottom');
  };
  _dragCleanup.add(document, 'touchmove', touchMoveHandler, { passive: false });

  const touchEndHandler = () => {
    if (!_touchClone) return;
    const dropTarget = document.querySelector('.drag-over-top, .drag-over-bottom');
    if (dropTarget && _touchDragEl) {
      const before = dropTarget.classList.contains('drag-over-top');
      if (_touchDragEl.classList.contains('list-asset') && dropTarget.classList.contains('list-asset')) {
        const fromId = _touchDragEl.dataset.id;
        const toId = dropTarget.dataset.id;
        if (fromId && toId && _touchDragEl.dataset.cat === dropTarget.dataset.cat && fromId !== toId) {
          onReorderAsset(fromId, toId, before);
        }
      } else if (_touchDragEl.classList.contains('list-cat') && dropTarget.classList.contains('list-cat')) {
        const fromCat = _touchDragEl.dataset.cat;
        const toCat = dropTarget.dataset.cat;
        if (fromCat && toCat && fromCat !== toCat) {
          onReorderCategory(fromCat, toCat, before);
        }
      }
    }
    cleanupTouchDrag();
  };
  _dragCleanup.add(document, 'touchend', touchEndHandler);
  _dragCleanup.add(document, 'touchcancel', cleanupTouchDrag);

  $$('.drag-handle').forEach(handle => {
    _dragCleanup.add(handle, 'touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      const target = handle.closest('.list-asset') || handle.closest('.list-cat');
      if (!target) return;
      _touchDragEl = target;
      _touchInsertBefore = false;
      _touchClone = target.cloneNode(true);
      _touchClone.classList.add('touch-ghost');
      _touchClone.style.width = target.offsetWidth + 'px';
      document.body.appendChild(_touchClone);
      positionGhost(e.touches[0]);
      target.classList.add('dragging');
      window.__dragInProgress = true;
    }, { passive: false });
  });
}

function cleanupTouchDrag() {
  if (_touchClone) { _touchClone.remove(); _touchClone = null; }
  if (_touchDragEl) { _touchDragEl.classList.remove('dragging'); _touchDragEl = null; }
  _touchInsertBefore = false;
  _clearDragOverClasses();
  _stopDragAutoScroll();
  setTimeout(() => { window.__dragInProgress = false; }, 50);
}

function positionGhost(touch) {
  if (!_touchClone) return;
  _touchClone.style.left = (touch.clientX - TOUCH_GHOST_OFFSET.x) + 'px';
  _touchClone.style.top = (touch.clientY - TOUCH_GHOST_OFFSET.y) + 'px';
}

function onReorderAsset(fromId, toId, insertBefore) {
  reorderAsset(fromId, toId, insertBefore);
  renderList();
}

function moveAssetOrder(id, direction) {
  const asset = getAsset(id);
  if (!asset) return;
  const siblings = appState.assets.filter(a => a.category === asset.category);
  const idx = siblings.findIndex(a => a.id === id);
  if (idx < 0 || siblings.length <= 1) return;

  let target = null;
  let insertBefore = true;
  let nextIndex = idx;
  if (direction === 'top') {
    target = siblings[0];
    insertBefore = true;
    nextIndex = 0;
  } else if (direction === 'up') {
    target = siblings[idx - 1];
    insertBefore = true;
    nextIndex = Math.max(0, idx - 1);
  } else if (direction === 'down') {
    target = siblings[idx + 1];
    insertBefore = false;
    nextIndex = Math.min(siblings.length - 1, idx + 1);
  } else if (direction === 'bottom') {
    target = siblings[siblings.length - 1];
    insertBefore = false;
    nextIndex = siblings.length - 1;
  }
  if (!target || target.id === id) return;

  UIState.listCategoryShown[asset.category] = Math.max(
    UIState.listCategoryShown[asset.category] || LAZY_RENDER_THRESHOLD,
    nextIndex + 1
  );
  reorderAsset(id, target.id, insertBefore);
  renderList();
  _focusMovedAsset(id, direction);
}

function _focusMovedAsset(id, direction) {
  requestAnimationFrame(() => {
    const el = $$('.list-asset').find(node => node.dataset.id === id);
    if (!el) return;
    const block = (direction === 'top' || direction === 'bottom') ? 'center' : 'nearest';
    el.scrollIntoView({ block, behavior: 'smooth' });
    const focusTarget = el.querySelector('[data-action="move-asset-top"]:not(:disabled)') ||
      el.querySelector('[data-action="move-asset-up"]:not(:disabled)') ||
      el;
    if (focusTarget && typeof focusTarget.focus === 'function') {
      try { focusTarget.focus({ preventScroll: true }); } catch (_) { focusTarget.focus(); }
    }
  });
}

function onReorderCategory(fromCat, toCat, insertBefore) {
  reorderCategory(fromCat, toCat, insertBefore);
  renderList();
}

function confirmDeleteAsset(id) {
  const asset = getAsset(id);
  if (!asset) return;
  openConfirmModal(
    `"${asset.name}" 자산을 삭제하시겠습니까?`,
    () => {
      const undo = deleteAsset(id);
      renderList();
      if (undo) showUndoToast(`"${asset.name}" 삭제됨`, () => { undo(); renderList(); });
      else showToast('삭제되었습니다');
    }
  );
}

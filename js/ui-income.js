/* =============================================
   My Portfolio v5.36.7 — Household Book UI
   Cycle C compatible
   ============================================= */

const BOOK_TYPES = Object.freeze({
  income: { label: '수입', sign: '+', cls: 'income', defaultCat: 'salary', sourceLabel: '출처', sourcePlaceholder: '예: 회사, 배당, 알바' },
  expense: { label: '지출', sign: '-', cls: 'expense', defaultCat: 'food', sourceLabel: '사용처', sourcePlaceholder: '예: 마트, 카페, 관리비' },
  saving: { label: '저축·이체', sign: '↔', cls: 'saving', defaultCat: 'deposit', sourceLabel: '이체 경로', sourcePlaceholder: '예: 급여통장 → 적금통장' },
});

function normalizeBookType(type, fallback = 'income') {
  return Object.prototype.hasOwnProperty.call(BOOK_TYPES, type) ? type : fallback;
}

const BOOK_FILTERS = Object.freeze([
  { id: 'all', label: '전체' },
  { id: 'expense', label: '지출' },
  { id: 'income', label: '수입' },
  { id: 'saving', label: '저축·이체' },
]);

const INCOME_COLORS = Object.freeze({
  salary: '#0057E7', bonus: '#55BFF2', side: '#A99BEF', invest: '#ED85AC',
  rental: '#003FA8', interest: '#8CDCFF', other: '#9DAAC7',
});

const EXPENSE_COLORS = Object.freeze({
  food: '#0057E7', cafe: '#ED85AC', transport: '#55BFF2', housing: '#003FA8',
  life: '#A99BEF', shopping: '#F29CBD', health: '#8172D8', family: '#8CDCFF',
  tax: '#8297BA', travel: '#6F72D8', other: '#9DAAC7',
});

const BOOK_CUSTOM_COLORS = Object.freeze([
  '#0057E7', '#55BFF2', '#ED85AC', '#A99AF2', '#8172D8',
  '#8CDCFF', '#F29CBD', '#A99BEF', '#006FD6', '#8297BA', '#003FA8',
]);

const BOOK_PAYMENT_KINDS = Object.freeze({
  credit: { label: '신용카드', short: '신용' },
  debit: { label: '체크카드', short: '체크' },
  cash: { label: '현금', short: '현금' },
  transfer: { label: '계좌이체', short: '이체' },
  deposit: { label: '입금계좌', short: '입금' },
  simple: { label: '간편결제', short: '간편' },
  other: { label: '기타', short: '기타' },
});

const POINT_ENTRY_TYPES = Object.freeze({
  earned: { label: '적립', sign: '+', cls: 'earned' },
  used: { label: '사용', sign: '-', cls: 'used' },
  expired: { label: '소멸', sign: '-', cls: 'expired' },
  adjusted: { label: '잔액조정', sign: '+', cls: 'adjusted' },
});

const GIFTICON_SOURCES = Object.freeze({
  gift: { label: '선물 받음', short: '선물' },
  purchased: { label: '직접 구매', short: '구매' },
  reward: { label: '혜택·이벤트', short: '혜택' },
});

const GIFTICON_STATUSES = Object.freeze({
  unused: { label: '미사용', cls: 'unused' },
  used: { label: '사용 완료', cls: 'used' },
  sold: { label: '판매 완료', cls: 'sold' },
  expired: { label: '만료', cls: 'expired' },
});

let _ledgerAttachmentDraft = { imageData: '', imageName: '' };
let _ledgerReceiptAnalysis = null;
let _pointEntrySaving = false;

const SAVING_COLORS = Object.freeze({
  deposit: '#006FD6', investment: '#8172D8', retirement: '#A99BEF', purpose: '#ED85AC', transfer: '#55BFF2', other: '#9DAAC7',
});

const BOOK_DEFAULT_PAYMENT_METHODS = Object.freeze([
  { label: '신용카드', kind: 'credit' },
  { label: '체크카드', kind: 'debit' },
  { label: '현금', kind: 'cash' },
  { label: '계좌이체', kind: 'transfer' },
  { label: '계좌입금', kind: 'deposit' },
  { label: '간편결제', kind: 'simple' },
  { label: '기타', kind: 'other' },
]);

const BOOK_SUBCATEGORIES = Object.freeze({
  expense: Object.freeze({
    food: ['식사', '외식', '배달', '장보기'],
    cafe: ['카페', '간식', '음료'],
    transport: ['대중교통', '택시', '주유', '주차', '차량정비'],
    housing: ['월세/관리비', '전기/가스', '수도', '인터넷', '휴대폰'],
    life: ['생필품', '청소용품', '가구/인테리어'],
    shopping: ['의류', '뷰티', '전자기기', '취미용품'],
    health: ['병원', '약국', '운동', '건강식품'],
    family: ['육아', '부모님', '경조사', '반려동물'],
    tax: ['세금', '건강보험', '자동차보험', '기타보험'],
    travel: ['숙박', '교통', '관람', '여행식비'],
    other: ['기타'],
  }),
  income: Object.freeze({
    salary: ['월급', '성과급', '수당'],
    bonus: ['상여', '명절상여', '인센티브'],
    side: ['프리랜서', '아르바이트', '판매'],
    invest: ['주식', '코인', '매매차익'],
    rental: ['월세', '임대보증금 이자'],
    interest: ['예금이자', '주식배당', '채권이자'],
    other: ['환급', '중고판매', '기타'],
  }),
  saving: Object.freeze({
    deposit: ['적금', '예금', '청약'],
    investment: ['주식', 'ETF', '펀드', '채권', '기타 투자'],
    retirement: ['연금저축', 'IRP', '개인연금', '기타 노후자금'],
    purpose: ['비상금', '여행', '큰 지출', '기타 목표'],
    transfer: ['내 계좌 간 이동', '만기 재예치', '투자계좌 이동', '기타 자산이동'],
    other: ['기타'],
  }),
});
const BOOK_CAT_MAX_PER_TYPE = 40;
let _bookCatManagerType = 'expense';
let _bookYearReviewYear = new Date().getFullYear();
let _bookYearReviewShowSubcats = false;
let _bookYearReviewOpen = false;
let _bookBenefitsOpen = false;

function getBookSubcategorySuggestions(type, catId) {
  const cleanType = normalizeBookType(type, 'expense');
  const prefs = getBookCategoryPrefs()[cleanType];
  if (Object.prototype.hasOwnProperty.call(prefs.subcategories, catId)) {
    return prefs.subcategories[catId];
  }
  return BOOK_SUBCATEGORIES[cleanType]?.[catId] || [];
}

function getBookSubcategoryLabel(item) {
  return stripHtml(item?.subcat || '', 40);
}

function normalizeBookPaymentMethods(raw) {
  if (!Array.isArray(raw)) return BOOK_DEFAULT_PAYMENT_METHODS.map(method => ({ ...method }));
  const methods = [];
  const seen = new Set();
  for (const value of raw) {
    const label = stripHtml(typeof value === 'string' ? value : value?.label || '', 40);
    const inferredKind = /체크/.test(label) ? 'debit' : /신용/.test(label) ? 'credit'
      : /현금/.test(label) ? 'cash' : /입금/.test(label) ? 'deposit'
      : /계좌|이체/.test(label) ? 'transfer' : /페이|간편/.test(label) ? 'simple' : 'other';
    const kind = BOOK_PAYMENT_KINDS[value?.kind] ? value.kind : inferredKind;
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    methods.push({ label, kind });
    seen.add(key);
    if (methods.length >= 30) break;
  }
  return methods.length ? methods : BOOK_DEFAULT_PAYMENT_METHODS.map(method => ({ ...method }));
}

function getBookPaymentMethods() {
  return normalizeBookPaymentMethods(appState.bookPaymentMethods);
}

function renderLedgerPaymentSelector(selectedPayment = '') {
  const clean = stripHtml(selectedPayment, 40);
  const methods = getBookPaymentMethods();
  const options = clean && !methods.some(method => method.label === clean)
    ? [{ label: clean, kind: inferBookPaymentKind(clean) }, ...methods]
    : methods;
  return `<input type="hidden" id="ledgerPayment" value="${escAttr(clean)}">
    <div class="ledger-payment-choices" role="radiogroup" aria-label="결제 또는 입금 수단">
      <button type="button" class="ledger-payment-choice ${!clean ? 'active' : ''}" data-action="select-book-payment" data-payment="" role="radio" aria-checked="${!clean}">선택 안 함</button>
      ${options.map(method => `<button type="button" class="ledger-payment-choice ${method.label === clean ? 'active' : ''}"
        data-action="select-book-payment" data-payment="${escAttr(method.label)}" role="radio" aria-checked="${method.label === clean}">
        ${escHtml(method.label)}<small>${escHtml(BOOK_PAYMENT_KINDS[method.kind]?.short || '기타')}</small>
      </button>`).join('')}
    </div>`;
}

function inferBookPaymentKind(payment) {
  const clean = stripHtml(payment || '', 40);
  return getBookPaymentMethods().find(method => method.label === clean)?.kind
    || (/체크/.test(clean) ? 'debit' : /신용/.test(clean) ? 'credit'
      : /현금/.test(clean) ? 'cash' : /입금/.test(clean) ? 'deposit'
      : /계좌|이체/.test(clean) ? 'transfer' : /페이|간편/.test(clean) ? 'simple' : 'other');
}

function renderBookPaymentMethodRow(method) {
  const clean = typeof method === 'string' ? { label: method, kind: inferBookPaymentKind(method) } : method;
  return `<div class="book-payment-method-row" data-original-label="${escAttr(clean.label)}" tabindex="0">
    <div class="book-payment-method-fields">
      <input type="text" class="book-payment-method-name" value="${escAttr(clean.label)}" maxlength="40" aria-label="결제 수단 이름">
      <select class="book-payment-method-kind" aria-label="${escAttr(clean.label)} 유형">
        ${Object.entries(BOOK_PAYMENT_KINDS).map(([value, meta]) => `<option value="${value}" ${clean.kind === value ? 'selected' : ''}>${escHtml(meta.label)}</option>`).join('')}
      </select>
    </div>
    <button type="button" class="btn-icon btn-danger" data-action="delete-book-payment-method" aria-label="${escAttr(clean.label)} 삭제">✕</button>
  </div>`;
}

function openBookPaymentManager() {
  const container = $('#modalSub');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <div class="modal-header">
        <h3>결제·입금 수단 관리</h3>
        <button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="book-cat-manager-hint book-payment-manager-hint">칸을 잡아 순서를 바꾸고 이름·유형을 수정하세요. 아래 저장 버튼 한 번으로 모두 저장됩니다.</div>
        <div class="book-payment-method-list">
          ${getBookPaymentMethods().map(renderBookPaymentMethodRow).join('')}
        </div>
        <div class="book-cat-add">
          <div class="book-cat-add-title">새 결제 수단</div>
          <div class="book-payment-method-add">
            <input type="text" id="bookPaymentMethodNew" placeholder="예: KB 톡톡카드" maxlength="40">
            <select id="bookPaymentMethodKind" aria-label="새 결제 수단 유형">
              ${Object.entries(BOOK_PAYMENT_KINDS).map(([value, meta]) => `<option value="${value}">${escHtml(meta.label)}</option>`).join('')}
            </select>
            <button type="button" class="btn-p" data-action="add-book-payment-method">추가</button>
          </div>
        </div>
        <div class="modal-actions book-payment-method-footer">
          <button type="button" class="btn-sm" data-action="restore-book-payment-methods">기본값 복원</button>
          <button type="button" class="btn-p" data-action="save-book-payment-methods">변경사항 저장</button>
        </div>
      </div>
    </div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'add-book-payment-method') doAddBookPaymentMethodDraft();
    else if (action === 'delete-book-payment-method') {
      const rows = $$('.book-payment-method-row', container);
      if (rows.length <= 1) { showToast('결제 수단은 최소 1개가 필요합니다', 'error'); return; }
      target.closest('.book-payment-method-row')?.remove();
    } else if (action === 'restore-book-payment-methods') {
      const list = $('.book-payment-method-list', container);
      if (list) list.innerHTML = BOOK_DEFAULT_PAYMENT_METHODS.map(renderBookPaymentMethodRow).join('');
    } else if (action === 'save-book-payment-methods') doSaveBookPaymentMethods();
  });
  const newInput = $('#bookPaymentMethodNew', container);
  if (newInput) _modalCleanup.add(newInput, 'keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doAddBookPaymentMethodDraft(); }
  });
  _setupPointerSortable($('.book-payment-method-list', container), '.book-payment-method-row', () => {});
}

function readBookPaymentMethodDrafts() {
  return $$('.book-payment-method-row', $('#modalSub')).map(row => ({
    label: stripHtml($('.book-payment-method-name', row)?.value || '', 40),
    kind: BOOK_PAYMENT_KINDS[$('.book-payment-method-kind', row)?.value]
      ? $('.book-payment-method-kind', row).value : 'other',
    originalLabel: stripHtml(row.dataset.originalLabel || '', 40),
  }));
}

function validateBookPaymentMethods(methods) {
  if (methods.some(method => !method.label)) { showToast('비어 있는 결제 수단 이름이 있습니다', 'error'); return false; }
  const keys = methods.map(method => method.label.toLowerCase());
  if (new Set(keys).size !== keys.length) { showToast('중복된 결제 수단 이름이 있습니다', 'error'); return false; }
  return true;
}

function doAddBookPaymentMethodDraft() {
  const input = $('#bookPaymentMethodNew', $('#modalSub'));
  const method = stripHtml(input?.value || '', 40);
  const methods = readBookPaymentMethodDrafts();
  if (!validateBookPaymentMethods(methods)) return;
  if (!method) { showToast('결제 수단 이름을 입력하세요', 'error'); return; }
  if (methods.some(value => value.label.toLowerCase() === method.toLowerCase())) { showToast('이미 같은 결제 수단이 있습니다', 'error'); return; }
  if (methods.length >= 30) { showToast('결제 수단은 최대 30개까지 추가할 수 있습니다', 'error'); return; }
  const kind = BOOK_PAYMENT_KINDS[$('#bookPaymentMethodKind', $('#modalSub'))?.value]
    ? $('#bookPaymentMethodKind', $('#modalSub')).value : 'other';
  $('.book-payment-method-list', $('#modalSub'))?.insertAdjacentHTML('beforeend', renderBookPaymentMethodRow({ label: method, kind }));
  if (input) { input.value = ''; input.focus(); }
}

function doSaveBookPaymentMethods() {
  const methods = readBookPaymentMethodDrafts();
  if (!methods.length) { showToast('결제 수단은 최소 1개가 필요합니다', 'error'); return; }
  if (!validateBookPaymentMethods(methods)) return;
  const selected = $('#ledgerPayment')?.value || '';
  const renameMap = new Map(methods.filter(method => method.originalLabel && method.originalLabel !== method.label)
    .map(method => [method.originalLabel, method.label]));
  appState.income = appState.income.map(item => renameMap.has(item.payment)
    ? sanitizeIncome({ ...item, payment: renameMap.get(item.payment) }) : item);
  appState.bookPaymentMethods = methods.map(({ label, kind }) => ({ label, kind }));
  saveDataNow();
  const wrap = $('#ledgerPaymentWrap');
  if (wrap) wrap.innerHTML = renderLedgerPaymentSelector(renameMap.get(selected) || selected);
  closeModal('modalSub');
  showToast('결제 수단 변경사항이 저장되었습니다', 'success');
}

const BOOK_ACCOUNT_KINDS = Object.freeze({
  transaction: { label: '입출금', short: '입출금' },
  saving: { label: '예적금', short: '예적금' },
  cma: { label: 'CMA·파킹', short: 'CMA' },
  securities: { label: '증권', short: '증권' },
  pension: { label: '연금', short: '연금' },
  cash: { label: '현금', short: '현금' },
  other: { label: '기타', short: '기타' },
});

const BOOK_DEFAULT_ACCOUNTS = Object.freeze([
  { id: 'account_main', name: '주거래 통장', institution: '', kind: 'transaction' },
  { id: 'account_saving', name: '저축 통장', institution: '', kind: 'saving' },
  { id: 'account_securities', name: '증권계좌', institution: '', kind: 'securities' },
  { id: 'account_pension', name: '연금계좌', institution: '', kind: 'pension' },
]);

function normalizeBookAccounts(raw) {
  if (!Array.isArray(raw)) return BOOK_DEFAULT_ACCOUNTS.map(account => ({ ...account }));
  const accounts = [];
  const ids = new Set();
  const names = new Set();
  for (const value of raw) {
    if (!value || typeof value !== 'object') continue;
    const rawId = value.id ? String(value.id) : `account_${uid()}`;
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
    const name = stripHtml(value.name || '', 40);
    const institution = stripHtml(value.institution || '', 30);
    const kind = BOOK_ACCOUNT_KINDS[value.kind] ? value.kind : 'other';
    const nameKey = `${institution}|${name}`.toLowerCase();
    if (!id || !name || ids.has(id) || names.has(nameKey)) continue;
    accounts.push({ id, name, institution, kind });
    ids.add(id);
    names.add(nameKey);
    if (accounts.length >= 40) break;
  }
  return accounts.length ? accounts : BOOK_DEFAULT_ACCOUNTS.map(account => ({ ...account }));
}

function getBookAccounts() {
  return normalizeBookAccounts(appState.bookAccounts);
}

function getBookAccount(id) {
  return getBookAccounts().find(account => account.id === id) || null;
}

function getBookAccountLabel(id) {
  const account = getBookAccount(id);
  if (!account) return id ? '이전 계좌' : '';
  return `${account.institution ? `${account.institution} ` : ''}${account.name}`;
}

function renderLedgerAccountSelector(field, selectedId = '') {
  const clean = stripHtml(selectedId || '', 80);
  const accounts = getBookAccounts();
  const label = field === 'fromAccount' ? '출금 계좌' : '입금 계좌';
  return `<input type="hidden" id="ledger${field === 'fromAccount' ? 'From' : 'To'}Account" value="${escAttr(clean)}">
    <div class="ledger-payment-choices ledger-account-choices" role="radiogroup" aria-label="${label}">
      <button type="button" class="ledger-payment-choice ${!clean ? 'active' : ''}" data-action="select-book-account"
        data-account-field="${field}" data-account="" role="radio" aria-checked="${!clean}">선택 안 함</button>
      ${accounts.map(account => `<button type="button" class="ledger-payment-choice ${account.id === clean ? 'active' : ''}"
        data-action="select-book-account" data-account-field="${field}" data-account="${escAttr(account.id)}"
        role="radio" aria-checked="${account.id === clean}">${escHtml(account.institution ? `${account.institution} ${account.name}` : account.name)}<small>${escHtml(BOOK_ACCOUNT_KINDS[account.kind].short)}</small></button>`).join('')}
    </div>`;
}

function renderBookAccountRow(account) {
  return `<div class="book-payment-method-row book-account-row" data-account-id="${escAttr(account.id)}" tabindex="0">
    <div class="book-account-fields">
      <input type="text" class="book-account-institution" value="${escAttr(account.institution)}" maxlength="30" placeholder="금융기관" aria-label="금융기관">
      <input type="text" class="book-account-name" value="${escAttr(account.name)}" maxlength="40" placeholder="통장 이름" aria-label="통장 이름">
      <select class="book-account-kind" aria-label="${escAttr(account.name)} 계좌 유형">
        ${Object.entries(BOOK_ACCOUNT_KINDS).map(([value, meta]) => `<option value="${value}" ${account.kind === value ? 'selected' : ''}>${escHtml(meta.label)}</option>`).join('')}
      </select>
    </div>
    <button type="button" class="btn-icon btn-danger" data-action="delete-book-account" aria-label="${escAttr(account.name)} 삭제">✕</button>
  </div>`;
}

function openBookAccountManager() {
  const container = $('#modalSub');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-large">
      <div class="modal-header">
        <h3>통장·계좌 관리</h3>
        <button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="book-cat-manager-hint book-payment-manager-hint">칸 전체를 잡아 순서를 바꾸고 금융기관·이름·유형을 수정하세요. 계좌번호는 저장하지 않습니다.</div>
        <div class="book-account-list">${getBookAccounts().map(renderBookAccountRow).join('')}</div>
        <div class="book-cat-add">
          <div class="book-cat-add-title">새 통장·계좌</div>
          <div class="book-account-add">
            <input type="text" id="bookAccountInstitutionNew" placeholder="금융기관 (예: KB)" maxlength="30">
            <input type="text" id="bookAccountNameNew" placeholder="통장 이름" maxlength="40">
            <select id="bookAccountKindNew" aria-label="새 계좌 유형">
              ${Object.entries(BOOK_ACCOUNT_KINDS).map(([value, meta]) => `<option value="${value}">${escHtml(meta.label)}</option>`).join('')}
            </select>
            <button type="button" class="btn-p" data-action="add-book-account">추가</button>
          </div>
        </div>
        <div class="modal-actions book-payment-method-footer">
          <button type="button" class="btn-sm" data-action="restore-book-accounts">기본값 복원</button>
          <button type="button" class="btn-p" data-action="save-book-accounts">변경사항 저장</button>
        </div>
      </div>
    </div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'add-book-account') doAddBookAccountDraft();
    else if (action === 'delete-book-account') target.closest('.book-account-row')?.remove();
    else if (action === 'restore-book-accounts') {
      const list = $('.book-account-list', container);
      if (list) list.innerHTML = BOOK_DEFAULT_ACCOUNTS.map(renderBookAccountRow).join('');
    } else if (action === 'save-book-accounts') doSaveBookAccounts();
  });
  _setupPointerSortable($('.book-account-list', container), '.book-account-row', () => {});
}

function readBookAccountDrafts() {
  return $$('.book-account-row', $('#modalSub')).map(row => ({
    id: stripHtml(row.dataset.accountId || `account_${uid()}`, 80).replace(/[^a-zA-Z0-9_-]/g, ''),
    institution: stripHtml($('.book-account-institution', row)?.value || '', 30),
    name: stripHtml($('.book-account-name', row)?.value || '', 40),
    kind: BOOK_ACCOUNT_KINDS[$('.book-account-kind', row)?.value] ? $('.book-account-kind', row).value : 'other',
  }));
}

function validateBookAccounts(accounts) {
  if (accounts.length < 2) { showToast('이체를 위해 계좌를 2개 이상 등록해 주세요', 'error'); return false; }
  if (accounts.some(account => !account.name)) { showToast('비어 있는 통장 이름이 있습니다', 'error'); return false; }
  const keys = accounts.map(account => `${account.institution}|${account.name}`.toLowerCase());
  if (new Set(keys).size !== keys.length) { showToast('같은 금융기관에 중복된 통장 이름이 있습니다', 'error'); return false; }
  return true;
}

function doAddBookAccountDraft() {
  const container = $('#modalSub');
  const nameInput = $('#bookAccountNameNew', container);
  const name = stripHtml(nameInput?.value || '', 40);
  if (!name) { showToast('통장 이름을 입력하세요', 'error'); return; }
  const accounts = readBookAccountDrafts();
  if (accounts.length >= 40) { showToast('통장은 최대 40개까지 추가할 수 있어요', 'error'); return; }
  const account = {
    id: `account_${uid()}`,
    institution: stripHtml($('#bookAccountInstitutionNew', container)?.value || '', 30),
    name,
    kind: BOOK_ACCOUNT_KINDS[$('#bookAccountKindNew', container)?.value] ? $('#bookAccountKindNew', container).value : 'other',
  };
  $('.book-account-list', container)?.insertAdjacentHTML('beforeend', renderBookAccountRow(account));
  if (nameInput) { nameInput.value = ''; nameInput.focus(); }
}

function doSaveBookAccounts() {
  const accounts = readBookAccountDrafts();
  if (!validateBookAccounts(accounts)) return;
  const keptIds = new Set(accounts.map(account => account.id));
  const usedIds = new Set(appState.income.flatMap(item => [item.fromAccount, item.toAccount]).filter(Boolean));
  const removedUsed = [...usedIds].filter(id => !keptIds.has(id));
  if (removedUsed.length) { showToast('기존 내역에 사용된 통장은 삭제할 수 없어요. 이름을 수정해 주세요.', 'error'); return; }
  const selectedFrom = $('#ledgerFromAccount')?.value || '';
  const selectedTo = $('#ledgerToAccount')?.value || '';
  appState.bookAccounts = accounts;
  saveDataNow();
  const fromWrap = $('#ledgerFromAccountWrap');
  const toWrap = $('#ledgerToAccountWrap');
  if (fromWrap) fromWrap.innerHTML = renderLedgerAccountSelector('fromAccount', selectedFrom);
  if (toWrap) toWrap.innerHTML = renderLedgerAccountSelector('toAccount', selectedTo);
  closeModal('modalSub');
  showToast('통장·계좌 변경사항이 저장되었습니다', 'success');
}

function getDefaultBookCategories(type) {
  return type === 'expense' ? EXPENSE_CATS : type === 'saving' ? SAVING_CATS : INCOME_CATS;
}

function getDefaultBookCategoryMap(type) {
  return type === 'expense' ? EXPENSE_MAP : type === 'saving' ? SAVING_MAP : INCOME_MAP;
}

function normalizeBookCategoryPrefs(raw) {
  const result = {
    income: { hidden: [], overrides: {}, custom: [], subcategories: {}, order: [] },
    expense: { hidden: [], overrides: {}, custom: [], subcategories: {}, order: [] },
    saving: { hidden: [], overrides: {}, custom: [], subcategories: {}, order: [] },
  };

  for (const type of ['income', 'expense', 'saving']) {
    const src = raw && typeof raw === 'object' && raw[type] && typeof raw[type] === 'object' ? raw[type] : {};
    const defaultIds = new Set(getDefaultBookCategories(type).map(c => c.id));

    result[type].hidden = Array.isArray(src.hidden)
      ? src.hidden.map(String).filter(id => id !== 'other' && defaultIds.has(id))
      : [];

    if (src.overrides && typeof src.overrides === 'object') {
      for (const [id, patch] of Object.entries(src.overrides)) {
        if (!defaultIds.has(id) || !patch || typeof patch !== 'object') continue;
        const label = stripHtml(patch.label, 30);
        const icon = stripHtml(patch.icon, 12);
        if (label || icon) result[type].overrides[id] = { label, icon };
      }
    }

    const seen = new Set(defaultIds);
    if (Array.isArray(src.custom)) {
      for (const c of src.custom) {
        if (!c || typeof c !== 'object') continue;
        const rawId = c.id ? String(c.id) : `custom_${uid()}`;
        const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
        const label = stripHtml(c.label, 30);
        const icon = stripHtml(c.icon, 12) || '🏷️';
        if (!id || !label || seen.has(id)) continue;
        result[type].custom.push({ id, label, icon });
        seen.add(id);
        if (result[type].custom.length >= BOOK_CAT_MAX_PER_TYPE) break;
      }
    }

    if (src.subcategories && typeof src.subcategories === 'object') {
      for (const [catId, labels] of Object.entries(src.subcategories)) {
        if (!seen.has(catId) || !Array.isArray(labels)) continue;
        const cleanLabels = [];
        const labelSet = new Set();
        for (const rawLabel of labels) {
          const label = stripHtml(rawLabel, 40);
          const key = label.toLowerCase();
          if (!label || labelSet.has(key)) continue;
          cleanLabels.push(label);
          labelSet.add(key);
          if (cleanLabels.length >= 30) break;
        }
        result[type].subcategories[catId] = cleanLabels;
      }
    }

    const orderSeen = new Set();
    if (Array.isArray(src.order)) {
      for (const rawId of src.order) {
        const id = String(rawId);
        if (!seen.has(id) || orderSeen.has(id)) continue;
        result[type].order.push(id);
        orderSeen.add(id);
      }
    }
    if (type === 'saving' && seen.has('retirement') && !orderSeen.has('retirement')) {
      const purposeIndex = result[type].order.indexOf('purpose');
      if (purposeIndex >= 0) result[type].order.splice(purposeIndex, 0, 'retirement');
      else result[type].order.push('retirement');
      orderSeen.add('retirement');
    }
    for (const id of seen) {
      if (!orderSeen.has(id)) result[type].order.push(id);
    }
  }

  return result;
}

function getBookCategoryPrefs() {
  return normalizeBookCategoryPrefs(appState.bookCategories);
}

function saveBookCategoryPrefs(prefs) {
  appState.bookCategories = normalizeBookCategoryPrefs(prefs);
  saveDataNow();
  EventBus.emit('bookCategoriesChanged');
}

function buildBookCategories(type) {
  const cleanType = normalizeBookType(type, 'income');
  const prefs = getBookCategoryPrefs()[cleanType];
  const hidden = new Set(prefs.hidden);
  const base = getDefaultBookCategories(cleanType)
    .filter(c => !hidden.has(c.id))
    .map(c => {
      const patch = prefs.overrides[c.id] || {};
      return {
        ...c,
        label: patch.label || c.label,
        icon: patch.icon || c.icon,
        builtin: true,
      };
    });
  const custom = prefs.custom.map(c => ({ ...c, builtin: false }));
  const all = [...base, ...custom];
  if (!all.some(c => c.id === 'other')) {
    const other = getDefaultBookCategoryMap(cleanType).other;
    all.push({ ...other, builtin: true });
  }
  const orderIndex = new Map(prefs.order.map((id, index) => [id, index]));
  return all.sort((a, b) => (orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

function hashBookCategoryId(id) {
  let hash = 0;
  for (const ch of String(id || '')) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

function getBookCategoryColor(type, catId) {
  const label = getBookCategoryMap(type)[catId]?.label || '';
  if (type === 'expense' && /(구독|멤버십)/.test(label)) return '#A99AF2';
  if (type === 'expense' && /생활/.test(label)) return '#70D1F4';
  if (type === 'expense' && /식비/.test(label)) return '#0057E7';
  const defaults = type === 'expense' ? EXPENSE_COLORS : type === 'saving' ? SAVING_COLORS : INCOME_COLORS;
  if (defaults[catId]) return defaults[catId];
  return BOOK_CUSTOM_COLORS[hashBookCategoryId(catId) % BOOK_CUSTOM_COLORS.length];
}

function renderIncome() {
  const container = $('#pgInc');
  if (!container) return;

  if (_bookBenefitsOpen) {
    renderBookBenefitsPage(container);
    return;
  }

  if (_bookYearReviewOpen) {
    renderBookYearReviewPage(container);
    return;
  }

  const [year, month] = UIState.incomeMonth.split('-').map(Number);
  const monthStr = `${year}년 ${month}월`;
  const items = getMonthIncome(year, month);
  const searchItems = UIState.bookSearchScope === 'all' ? appState.income : items;
  const filteredItems = filterBookItems(searchItems);
  const summary = calcBookSummary(items);
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const prevItems = getMonthIncome(prev.year, prev.month);
  const prevSummary = calcBookSummary(prevItems);
  const netDelta = prevSummary.net !== 0 ? summary.net - prevSummary.net : 0;
  const yearlySources = getMonthIncome(year - 1, month).filter(i => getBookRepeatCycle(i) === 'yearly');
  const hasRepeatSources = prevItems.some(i => getBookRepeatCycle(i) === 'monthly') || yearlySources.length > 0;

  container.innerHTML = `
    <div class="card stagger-item" style="--i:0">
      <div class="month-nav" role="navigation" aria-label="월 탐색">
        <button class="btn-icon" data-action="change-month" data-delta="-1" aria-label="이전 달">◀</button>
        <button type="button" class="book-month-picker" data-action="open-book-month-picker" aria-label="현재 ${escAttr(monthStr)}. 다른 연도와 월 선택"><b aria-live="polite">${escHtml(monthStr)}</b></button>
        <button class="btn-icon" data-action="change-month" data-delta="1" aria-label="다음 달">▶</button>
      </div>
      ${renderBookSummary(summary, prevSummary, netDelta)}
      ${renderBookRepeatSummary(items)}
      ${renderBookSettlementSummary(appState.income)}
    </div>

    <div class="dash-charts">
      <div class="card stagger-item" style="--i:1">
        <div class="card-title">${escHtml(getCategoryChartTitle(items))}</div>
        <div class="chart-wrap chart-wrap-220" role="img" aria-label="가계부 카테고리 차트">
          <canvas id="chartIncPie"></canvas>
        </div>
        <div id="chartIncPieAlt"></div>
        ${renderIncomeCatLegend(items)}
      </div>
      <div class="card stagger-item" style="--i:2">
        <div class="card-title book-calendar-title">
          <span>${month}월 지출 달력</span>
          <span class="book-calendar-legend">💙 무지출</span>
        </div>
        ${renderBookExpenseCalendar(items, year, month)}
      </div>
    </div>

    <div class="card stagger-item" style="--i:3">
      <div class="card-title">
        가계부 내역
        <div class="card-title-actions">
          <button class="btn-sm" data-action="open-book-year-review" aria-label="연간 가계부 결산">연간 결산</button>
          <button class="btn-sm" data-action="open-book-cats" aria-label="가계부 카테고리 관리">카테고리 관리</button>
          <button class="btn-p" data-action="open-add-income" aria-label="가계부 내역 추가">+ 내역 추가</button>
        </div>
      </div>
      ${renderBookToolbar(searchItems)}
      ${renderIncomeItems(filteredItems)}
      ${hasRepeatSources ? `
        <button class="btn-sm btn-mt" data-action="copy-recurring" data-year="${year}" data-month="${month}"
          aria-label="반복 내역 가져오기">
          🔁 반복 내역 가져오기
        </button>
      ` : ''}
    </div>

    ${renderBookSpendingAnalysis(items)}
    ${renderBookPaymentAnalysis(items)}
    ${renderBookBenefitsSummary(year, month)}
  `;

  runWhenIdle(() => renderIncomeCharts(items, year, month));
  _setupIncomeDelegation(container);
}

function _setupIncomeDelegation(container) {
  function handleAction(target) {
    const action = target.dataset.action;
    if (action === 'close-book-benefits') {
      _bookBenefitsOpen = false;
      renderIncome();
    }
    else if (action === 'change-month') changeMonth(Number(target.dataset.delta));
    else if (action === 'open-book-month-picker') openBookMonthPicker();
    else if (action === 'open-add-income') openAddIncome();
    else if (action === 'copy-income') openCopyIncome(target.dataset.id);
    else if (action === 'edit-income') openEditIncome(target.dataset.id);
    else if (action === 'delete-income') doDeleteIncome(target.dataset.id);
    else if (action === 'open-ledger-receipt') openLedgerReceiptImage(target.dataset.id);
    else if (action === 'copy-recurring') copyRecurring(Number(target.dataset.year), Number(target.dataset.month));
    else if (action === 'open-recurring-manager') openRecurringManager();
    else if (action === 'book-filter') setBookFilter(target.dataset.filter || 'all');
    else if (action === 'book-search-scope') setBookSearchScope(target.dataset.scope);
    else if (action === 'clear-book-search') clearBookSearch();
    else if (action === 'open-book-year-review') openBookYearReview();
    else if (action === 'open-book-cats') openBookCategoryManager();
    else if (action === 'open-book-benefits') {
      _bookBenefitsOpen = true;
      renderIncome();
    }
    else if (action === 'point-ledger-view') {
      UIState.pointLedgerView = ['month', 'year', 'all'].includes(target.dataset.view) ? target.dataset.view : 'month';
      renderIncome();
    }
    else if (action === 'open-add-point-entry') openPointEntryModal();
    else if (action === 'edit-point-entry') openPointEntryModal(target.dataset.id);
    else if (action === 'delete-point-entry') doDeletePointEntry(target.dataset.id);
    else if (action === 'open-add-gifticon') openGifticonModal();
    else if (action === 'edit-gifticon') openGifticonModal(target.dataset.id);
    else if (action === 'use-gifticon') doUseGifticon(target.dataset.id);
    else if (action === 'delete-gifticon') doDeleteGifticon(target.dataset.id);
    else if (action === 'open-add-family-fund') openFamilyFundModal();
    else if (action === 'edit-family-fund') openFamilyFundModal(target.dataset.id);
    else if (action === 'delete-family-fund') doDeleteFamilyFundEntry(target.dataset.id);
    else if (action === 'open-add-settlement-ledger') openSettlementLedgerModal();
    else if (action === 'edit-settlement-ledger') openSettlementLedgerModal(target.dataset.id);
    else if (action === 'add-settlement-repayment') openSettlementRepaymentModal(target.dataset.id);
    else if (action === 'edit-settlement-repayment') openSettlementRepaymentModal(target.dataset.id, target.dataset.paymentId);
    else if (action === 'delete-settlement-repayment') doDeleteSettlementRepayment(target.dataset.id, target.dataset.paymentId);
    else if (action === 'delete-settlement-ledger') doDeleteSettlementLedger(target.dataset.id);
  }
  container.onclick = (e) => {
    const target = e.target.closest('[data-action]');
    if (target) handleAction(target);
  };
  container.onkeydown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target.closest('[data-action]');
    if (target) { e.preventDefault(); handleAction(target); }
  };
  const search = $('#bookSearch', container);
  if (search) {
    search.oninput = debounce(() => {
      UIState.bookSearch = search.value.trim();
      renderIncome();
    }, 180);
  }
}

function getSettlementLedgerStats(item) {
  const paid = (item.repayments || []).reduce((sum, payment) => sum + safeNum(payment.amount), 0);
  return { paid, remaining: Math.max(0, safeNum(item.startingAmount) - paid) };
}

function renderBookBenefitsSummary(year, month) {
  const points = calcBookPointLedger(year, month, 'month');
  const gifticons = calcGifticonWallet(year, month);
  const settlementRemaining = (Array.isArray(appState.settlementLedgers) ? appState.settlementLedgers : [])
    .map(sanitizeSettlementLedger)
    .reduce((sum, item) => sum + getSettlementLedgerStats(item).remaining, 0);
  const familyFund = calcFamilyFundLedger();
  return `<section class="card book-benefits-summary stagger-item" style="--i:4" aria-label="혜택과 정산 요약">
    <div class="card-title book-benefits-summary-title">
      <span>혜택·정산 <small>가계부 합계와 별도 관리</small></span>
      <button type="button" class="btn-sm" data-action="open-book-benefits">전체 관리 →</button>
    </div>
    <div class="book-benefits-summary-grid">
      <div class="points"><span>포인트 잔액</span><strong>${escHtml(fmtKRW(points.balance))}</strong><small>선택한 달 말 기준</small></div>
      <div class="gifticons"><span>사용 가능한 기프티콘</span><strong>${gifticons.unusedCount}개</strong><small>${escHtml(fmtKRW(gifticons.balance))}</small></div>
      <div class="family-fund"><span>가족 공동자금</span><strong>${escHtml(fmtKRW(familyFund.balance))}</strong><small>받은 돈에서 사용액 차감</small></div>
      <div class="settlements"><span>아직 받을 돈</span><strong>${escHtml(fmtKRW(settlementRemaining))}</strong><small>대납·정산 잔액</small></div>
    </div>
  </section>`;
}

function renderBookBenefitsPage(container = $('#pgInc')) {
  if (!container) return;
  const [year, month] = UIState.incomeMonth.split('-').map(Number);
  container.innerHTML = `<section class="book-benefits-page">
    <div class="book-benefits-page-header">
      <button type="button" class="btn-sm book-benefits-back" data-action="close-book-benefits">← 가계부로</button>
      <div><h2>혜택·정산 관리</h2><p>가족 공동자금, 대납 정산, 포인트와 상품권을 가계부 합계와 섞지 않고 관리해요.</p></div>
    </div>
    ${renderFamilyFundLedger()}
    ${renderSettlementLedger()}
    ${renderBookPointLedger(year, month)}
    ${renderGifticonWallet(year, month)}
  </section>`;
  _setupIncomeDelegation(container);
}

function calcFamilyFundLedger() {
  const entries = (Array.isArray(appState.familyFundEntries) ? appState.familyFundEntries : [])
    .map(sanitizeFamilyFundEntry)
    .filter(entry => entry.amount > 0)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.id).localeCompare(String(a.id)));
  const received = entries.filter(entry => entry.type === 'received').reduce((sum, entry) => sum + entry.amount, 0);
  const used = entries.filter(entry => entry.type === 'used').reduce((sum, entry) => sum + entry.amount, 0);
  return { entries, received, used, balance: received - used };
}

function renderFamilyFundLedger() {
  const data = calcFamilyFundLedger();
  return `<section class="card family-fund-card" aria-label="가족 공동자금 장부">
    <div class="card-title"><span>가족 공동자금 <small>수입·지출 합계에서 제외</small></span><button type="button" class="btn-p" data-action="open-add-family-fund">+ 받은 돈·사용 등록</button></div>
    <div class="family-fund-summary">
      <div><span>가족에게 받은 돈</span><strong>${escHtml(fmtKRW(data.received))}</strong></div>
      <div><span>주담대 등에 사용</span><strong>${escHtml(fmtKRW(data.used))}</strong></div>
      <div class="is-main"><span>남아 있는 공동자금</span><strong>${escHtml(fmtKRW(data.balance))}</strong></div>
    </div>
    ${data.entries.length ? `<div class="family-fund-list">${data.entries.map(entry => `<article class="family-fund-entry ${entry.type}">
      <time datetime="${escAttr(entry.date)}">${escHtml(entry.date.replaceAll('-', '.'))}</time>
      <div><strong>${entry.type === 'received' ? escHtml(entry.person || '가족') : '공동자금 사용'}${entry.isEstimate ? '<em>추정</em>' : ''}</strong><span>${escHtml(entry.purpose)}${entry.memo ? ` · ${escHtml(entry.memo)}` : ''}</span></div>
      <b>${entry.type === 'received' ? '+' : '-'}${escHtml(fmtKRW(entry.amount))}</b>
      <button type="button" class="btn-icon" data-action="edit-family-fund" data-id="${escAttr(entry.id)}" aria-label="${escAttr(entry.date)} 가족 공동자금 수정">✎</button>
      <button type="button" class="btn-icon btn-danger" data-action="delete-family-fund" data-id="${escAttr(entry.id)}" aria-label="${escAttr(entry.date)} 가족 공동자금 삭제">✕</button>
    </article>`).join('')}</div>` : `<div class="family-fund-empty"><strong>아직 가족 공동자금 기록이 없어요</strong><span>엄마·동생에게 받은 돈과 주담대에 사용한 돈을 차례로 남겨 보세요.</span></div>`}
    <p class="family-fund-guide">기억이 정확하지 않은 과거 입금은 ‘추정 금액’으로 표시할 수 있어요. 이 장부는 내 수입이나 지출을 늘리지 않습니다.</p>
  </section>`;
}

function openFamilyFundModal(id = '') {
  const entry = id ? (appState.familyFundEntries || []).find(value => value.id === id) : null;
  const type = entry?.type === 'used' ? 'used' : 'received';
  const people = [...new Set(['엄마', '동생', ...(appState.familyFundEntries || []).map(value => value.person)].filter(Boolean))];
  const container = $('#modalSub');
  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box modal-box-sm"><div class="modal-header"><h3>가족 공동자금 ${entry ? '수정' : '등록'}</h3><button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button></div><div class="modal-body">
    <div class="family-fund-type-choices" role="radiogroup" aria-label="공동자금 기록 유형"><button type="button" class="${type === 'received' ? 'active' : ''}" data-action="set-family-fund-type" data-type="received" role="radio" aria-checked="${type === 'received'}">가족에게 받음</button><button type="button" class="${type === 'used' ? 'active' : ''}" data-action="set-family-fund-type" data-type="used" role="radio" aria-checked="${type === 'used'}">주담대 등에 사용</button></div>
    <input type="hidden" id="familyFundType" value="${type}">
    <div id="familyFundPersonBlock" class="form-group ${type === 'received' ? '' : 'hidden'}"><label for="familyFundPerson">보낸 사람 *</label><input id="familyFundPerson" value="${escAttr(entry?.person || '')}" maxlength="40" placeholder="예: 엄마"><div class="settlement-person-choices">${people.map(person => `<button type="button" class="settlement-person-choice ${person === entry?.person ? 'active' : ''}" data-action="select-family-fund-person" data-person="${escAttr(person)}">${escHtml(person)}</button>`).join('')}</div></div>
    <div class="form-row"><div class="form-group"><label for="familyFundAmount">금액 *</label><input type="number" inputmode="decimal" id="familyFundAmount" value="${entry ? escAttr(entry.amount) : ''}" min="1" placeholder="0"></div><div class="form-group"><label for="familyFundDate">날짜 *</label><input type="date" id="familyFundDate" value="${escAttr(entry?.date || today())}"></div></div>
    <div class="form-group"><label for="familyFundPurpose">용도 *</label><input id="familyFundPurpose" value="${escAttr(entry?.purpose || '주택담보대출 상환')}" maxlength="100" placeholder="예: 주택담보대출 원금 상환"></div>
    <label class="settlement-estimate-check"><input type="checkbox" id="familyFundEstimate" ${entry?.isEstimate ? 'checked' : ''}> 날짜나 금액이 정확하지 않은 추정 기록이에요</label>
    <div class="form-group"><label for="familyFundMemo">메모</label><input id="familyFundMemo" value="${escAttr(entry?.memo || '')}" maxlength="180" placeholder="필요한 설명이 있을 때만 입력"></div>
    <div class="modal-actions"><button class="btn-s" data-action="close-sub-modal">취소</button><button class="btn-p" data-action="save-family-fund" data-id="${escAttr(id)}">저장</button></div></div></div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'set-family-fund-type') {
      const nextType = target.dataset.type === 'used' ? 'used' : 'received';
      $('#familyFundType', container).value = nextType;
      $('#familyFundPersonBlock', container).classList.toggle('hidden', nextType !== 'received');
      $$('.family-fund-type-choices button', container).forEach(button => {
        const selected = button.dataset.type === nextType;
        button.classList.toggle('active', selected); button.setAttribute('aria-checked', String(selected));
      });
    } else if (action === 'select-family-fund-person') {
      $('#familyFundPerson', container).value = target.dataset.person || '';
      $$('.settlement-person-choice', container).forEach(button => button.classList.toggle('active', button === target));
    } else if (action === 'save-family-fund') {
      const nextType = $('#familyFundType', container).value === 'used' ? 'used' : 'received';
      const person = stripHtml($('#familyFundPerson', container)?.value || '', 40);
      const amount = Math.abs(safeNum($('#familyFundAmount', container)?.value));
      const date = $('#familyFundDate', container)?.value || '';
      const purpose = stripHtml($('#familyFundPurpose', container)?.value || '', 100);
      if ((nextType === 'received' && !person) || amount <= 0 || !isValidDate(date) || !purpose) { showToast('보낸 사람·금액·날짜·용도를 확인해 주세요', 'error'); return; }
      const values = { type: nextType, person, amount, date, purpose, memo: stripHtml($('#familyFundMemo', container)?.value || '', 180), isEstimate: Boolean($('#familyFundEstimate', container)?.checked) };
      if (target.dataset.id) updateFamilyFundEntry(target.dataset.id, values); else addFamilyFundEntry(values);
      closeModal('modalSub'); showToast(`가족 공동자금을 ${target.dataset.id ? '수정' : '등록'}했어요`, 'success'); renderIncome();
    }
  });
}

function doDeleteFamilyFundEntry(id) {
  const entry = (appState.familyFundEntries || []).find(value => value.id === id);
  if (!entry) return;
  openConfirmModal(`${entry.date} ${entry.type === 'received' ? `${entry.person}에게 받은 돈` : '공동자금 사용'} ${fmtKRW(entry.amount)} 기록을 삭제할까요?`, () => {
    deleteFamilyFundEntry(id); showToast('가족 공동자금 기록을 삭제했어요', 'success'); renderIncome();
  });
}

function renderSettlementLedger() {
  const ledgers = (Array.isArray(appState.settlementLedgers) ? appState.settlementLedgers : []).map(sanitizeSettlementLedger)
    .sort((a, b) => (getSettlementLedgerStats(b).remaining > 0 ? 1 : 0) - (getSettlementLedgerStats(a).remaining > 0 ? 1 : 0) || (b.startDate || '').localeCompare(a.startDate || ''));
  const totalStarting = ledgers.reduce((sum, item) => sum + safeNum(item.startingAmount), 0);
  const totalPaid = ledgers.reduce((sum, item) => sum + getSettlementLedgerStats(item).paid, 0);
  const totalRemaining = ledgers.reduce((sum, item) => sum + getSettlementLedgerStats(item).remaining, 0);
  return `<section class="card settlement-ledger-card" aria-label="대납 정산 장부">
    <div class="card-title"><span>대납·정산 장부 <small>수입·지출 합계에서 제외</small></span><button type="button" class="btn-p" data-action="open-add-settlement-ledger">+ 받을 돈 등록</button></div>
    <div class="settlement-ledger-summary"><div><span>처음 받을 돈</span><strong>${escHtml(fmtKRW(totalStarting))}</strong></div><div><span>돌려받은 돈</span><strong>${escHtml(fmtKRW(totalPaid))}</strong></div><div class="is-main"><span>아직 받을 돈</span><strong>${escHtml(fmtKRW(totalRemaining))}</strong></div></div>
    ${ledgers.length ? `<div class="settlement-ledger-list">${ledgers.map(item => {
      const stats = getSettlementLedgerStats(item);
      const complete = stats.remaining <= 0;
      const repayments = [...(item.repayments || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return `<article class="settlement-ledger-item ${complete ? 'is-complete' : ''}">
        <div class="settlement-ledger-head"><div><strong class="settlement-person-pill">${escHtml(item.person || '정산 대상 미정')}</strong><span>${escHtml(item.title || '대납금')}${item.isEstimate ? '<em>추정 금액</em>' : ''}</span></div><div class="settlement-ledger-actions">${complete ? '<b class="settlement-complete-badge">정산 완료</b>' : `<button type="button" class="btn-sm settlement-repayment-button" data-action="add-settlement-repayment" data-id="${escAttr(item.id)}">+ 돌려받은 돈 입력</button>`}<button type="button" class="btn-icon" data-action="edit-settlement-ledger" data-id="${escAttr(item.id)}" aria-label="${escAttr(item.person)} 정산 장부 수정">✎</button><button type="button" class="btn-icon btn-danger" data-action="delete-settlement-ledger" data-id="${escAttr(item.id)}" aria-label="${escAttr(item.person)} 정산 장부 삭제">✕</button></div></div>
        <div class="settlement-progress-row"><span style="--settlement-progress:${Math.min(100, safeNum(item.startingAmount) > 0 ? stats.paid / safeNum(item.startingAmount) * 100 : 0)}%"></span></div>
        <div class="settlement-ledger-amounts"><span>시작 ${escHtml(fmtKRW(item.startingAmount))}</span><span>받음 ${escHtml(fmtKRW(stats.paid))}</span><strong>남음 ${escHtml(fmtKRW(stats.remaining))}</strong></div>
        ${repayments.length ? `<div class="settlement-payment-list">${repayments.map(payment => `<div><time>${escHtml(payment.date)}</time><span>${payment.memo ? escHtml(payment.memo) : '돌려받음'}</span><strong>+${escHtml(fmtKRW(payment.amount))}</strong><button type="button" data-action="edit-settlement-repayment" data-id="${escAttr(item.id)}" data-payment-id="${escAttr(payment.id)}" aria-label="${escAttr(payment.date)} 돌려받은 돈 수정">✎</button><button type="button" data-action="delete-settlement-repayment" data-id="${escAttr(item.id)}" data-payment-id="${escAttr(payment.id)}" aria-label="${escAttr(payment.date)} 돌려받은 돈 삭제">✕</button></div>`).join('')}</div>` : '<p class="settlement-no-payment">아직 돌려받은 기록이 없어요.</p>'}
        ${item.memo ? `<p class="settlement-ledger-memo">${escHtml(item.memo)}</p>` : ''}
      </article>`;
    }).join('')}</div>` : `<div class="settlement-ledger-empty"><strong>아직 정산 장부가 없어요</strong><span>과거 내역이 정확하지 않아도 현재 합의한 받을 금액부터 시작할 수 있어요.</span></div>`}
  </section>`;
}

function openSettlementLedgerModal(id = '') {
  const item = id ? (appState.settlementLedgers || []).find(value => value.id === id) : null;
  const people = [...new Set((appState.settlementLedgers || []).map(value => stripHtml(value.person || '', 40)).filter(Boolean))];
  const container = $('#modalSub');
  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box modal-box-sm"><div class="modal-header"><h3>${item ? '받을 돈 수정' : '받을 돈 등록'}</h3><button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button></div><div class="modal-body">
    <div class="form-row"><div class="form-group"><label for="settlementPerson">정산 대상 *</label><input id="settlementPerson" value="${escAttr(item?.person || '')}" maxlength="40" placeholder="새 이름 직접 입력"><div class="settlement-person-choices" role="radiogroup" aria-label="정산 대상 빠른 선택">${people.map(person => `<button type="button" class="settlement-person-choice ${person === item?.person ? 'active' : ''}" data-action="select-settlement-person" data-person="${escAttr(person)}" role="radio" aria-checked="${person === item?.person}">${escHtml(person)}</button>`).join('')}<button type="button" class="settlement-person-choice settlement-person-new ${!item?.person ? 'active' : ''}" data-action="focus-settlement-person">+ 새 대상</button></div></div><div class="form-group"><label for="settlementTitle">내용</label><input id="settlementTitle" value="${escAttr(item?.title || '')}" maxlength="80" placeholder="예: 과거 카드 사용액"></div></div>
    <div class="form-row"><div class="form-group"><label for="settlementStartingAmount">처음 받을 돈 *</label><input type="number" inputmode="decimal" id="settlementStartingAmount" value="${item ? escAttr(item.startingAmount) : ''}" min="1" placeholder="0"></div>${!item ? `<div class="form-group"><label for="settlementInitialPaid">이미 돌려받은 돈</label><input type="number" inputmode="decimal" id="settlementInitialPaid" min="0" placeholder="없으면 0"><small class="form-help">등록할 때 함께 입력해도 돼요.</small></div>` : ''}<div class="form-group"><label for="settlementStartDate">기준일 *</label><input type="date" id="settlementStartDate" value="${escAttr(item?.startDate || today())}"></div></div>
    <label class="settlement-estimate-check"><input type="checkbox" id="settlementIsEstimate" ${item?.isEstimate ? 'checked' : ''}> 정확하지 않은 추정 금액이에요</label>
    <div class="form-group"><label for="settlementMemo">메모</label><textarea id="settlementMemo" maxlength="200" placeholder="예: 과거 상세 내역 없음, 서로 합의한 잔액">${escHtml(item?.memo || '')}</textarea></div>
    <div class="modal-actions"><button class="btn-s" data-action="close-sub-modal">취소</button><button class="btn-p" data-action="save-settlement-ledger" data-id="${escAttr(id)}">저장</button></div></div></div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'focus-settlement-person') {
      const input = $('#settlementPerson', container);
      if (input) { input.value = ''; input.focus(); }
      $$('.settlement-person-choice', container).forEach(button => {
        button.classList.toggle('active', button === target);
        if (button.hasAttribute('role')) button.setAttribute('aria-checked', 'false');
      });
      return;
    }
    if (action === 'select-settlement-person') {
      const input = $('#settlementPerson', container);
      if (input) input.value = target.dataset.person || '';
      $$('.settlement-person-choice', container).forEach(button => {
        const selected = button === target;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-checked', String(selected));
      });
      return;
    }
    if (action !== 'save-settlement-ledger') return;
    const person = stripHtml($('#settlementPerson', container)?.value || '', 40);
    const startingAmount = Math.abs(safeNum($('#settlementStartingAmount', container)?.value));
    const initialPaid = item ? 0 : Math.abs(safeNum($('#settlementInitialPaid', container)?.value));
    const startDate = $('#settlementStartDate', container)?.value || '';
    if (!person || startingAmount <= 0 || !isValidDate(startDate)) { showToast('정산 대상·시작 금액·기준일을 확인해 주세요', 'error'); return; }
    if (initialPaid > startingAmount) { showToast('돌려받은 돈은 처음 받을 돈보다 클 수 없어요', 'error'); return; }
    const values = { person, title: stripHtml($('#settlementTitle', container)?.value || '', 80), startingAmount, startDate, isEstimate: Boolean($('#settlementIsEstimate', container)?.checked), memo: stripHtml($('#settlementMemo', container)?.value || '', 200) };
    if (!item && initialPaid > 0) values.repayments = [{ id: uid(), amount: initialPaid, date: startDate, memo: '등록 전 돌려받은 돈' }];
    if (target.dataset.id) updateSettlementLedger(target.dataset.id, values); else addSettlementLedger(values);
    closeModal('modalSub'); showToast(`받을 돈 장부를 ${target.dataset.id ? '수정' : '등록'}했어요`, 'success'); renderIncome();
  });
}

function openSettlementRepaymentModal(id, paymentId = '') {
  const item = (appState.settlementLedgers || []).find(value => value.id === id);
  if (!item) return;
  const payment = paymentId ? (item.repayments || []).find(value => value.id === paymentId) : null;
  const stats = getSettlementLedgerStats(item);
  const editableLimit = stats.remaining + safeNum(payment?.amount);
  const container = $('#modalSub');
  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box modal-box-sm"><div class="modal-header"><h3>돌려받은 돈 ${payment ? '수정' : '입력'}</h3><button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button></div><div class="modal-body">
    <div class="settlement-repayment-guide"><strong>${escHtml(item.person)}</strong><span>${payment ? '수정 가능한 최대 금액' : '현재 남은 돈'} ${escHtml(fmtKRW(editableLimit))}</span></div>
    <div class="form-row"><div class="form-group"><label for="settlementRepaymentAmount">받은 금액 *</label><input type="number" inputmode="decimal" id="settlementRepaymentAmount" value="${payment ? escAttr(payment.amount) : ''}" min="1" max="${editableLimit}" placeholder="0"></div><div class="form-group"><label for="settlementRepaymentDate">받은 날짜 *</label><input type="date" id="settlementRepaymentDate" value="${escAttr(payment?.date || today())}"></div></div>
    <div class="form-group"><label for="settlementRepaymentMemo">메모</label><input id="settlementRepaymentMemo" value="${escAttr(payment?.memo || '')}" maxlength="120" placeholder="예: 1차로 돌려받음"></div>
    <div class="modal-actions"><button class="btn-s" data-action="close-sub-modal">취소</button><button class="btn-p" data-action="save-settlement-repayment" data-id="${escAttr(id)}" data-payment-id="${escAttr(paymentId)}">${payment ? '수정 내용 저장' : '받은 돈 저장'}</button></div></div></div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action !== 'save-settlement-repayment') return;
    const amount = Math.abs(safeNum($('#settlementRepaymentAmount', container)?.value));
    const date = $('#settlementRepaymentDate', container)?.value || '';
    if (amount <= 0 || amount > editableLimit || !isValidDate(date)) { showToast(`받은 금액은 ${fmtKRW(editableLimit)} 이하로 입력해 주세요`, 'error'); return; }
    const nextPayment = { id: payment?.id || uid(), amount, date, memo: stripHtml($('#settlementRepaymentMemo', container)?.value || '', 120) };
    const repayments = payment
      ? (item.repayments || []).map(value => value.id === payment.id ? nextPayment : value)
      : [...(item.repayments || []), nextPayment];
    updateSettlementLedger(target.dataset.id, { repayments });
    closeModal('modalSub'); showToast(`돌려받은 돈을 ${payment ? '수정' : '추가'}했어요`, 'success'); renderIncome();
  });
}

function doDeleteSettlementRepayment(id, paymentId) {
  const item = (appState.settlementLedgers || []).find(value => value.id === id);
  const payment = item?.repayments?.find(value => value.id === paymentId);
  if (!item || !payment) return;
  openConfirmModal(`${payment.date}에 받은 ${fmtKRW(payment.amount)} 기록을 삭제할까요?`, () => { updateSettlementLedger(id, { repayments: item.repayments.filter(value => value.id !== paymentId) }); showToast('상환 기록을 삭제했어요', 'success'); renderIncome(); });
}

function doDeleteSettlementLedger(id) {
  const item = (appState.settlementLedgers || []).find(value => value.id === id);
  if (!item) return;
  openConfirmModal(`${item.person}의 대납·정산 장부와 상환 기록을 모두 삭제할까요?`, () => { deleteSettlementLedger(id); showToast('정산 장부를 삭제했어요', 'success'); renderIncome(); });
}

function getBookType(item) {
  return normalizeBookType(item?.type, 'income');
}

function getBookRepeatCycle(item) {
  if (['monthly', 'yearly'].includes(item?.repeatCycle)) return item.repeatCycle;
  return item?.recurring ? 'monthly' : '';
}

function getBookAdvanceInfo(item) {
  if (getBookType(item) !== 'expense') {
    return { expected: 0, settled: 0, outstanding: 0, personalExpense: safeNum(item?.amount), status: '' };
  }
  const paid = Math.max(0, safeNum(item?.amount));
  const expected = Math.min(paid, Math.max(0, safeNum(item?.advanceAmount)));
  const settled = Math.min(expected, Math.max(0, safeNum(item?.settledAmount)));
  const outstanding = Math.max(0, expected - settled);
  const status = expected <= 0 ? '' : outstanding <= 0 ? 'settled' : settled > 0 ? 'partial' : 'pending';
  return { expected, settled, outstanding, personalExpense: Math.max(0, paid - expected), status };
}

function getBookNetExpenseAmount(item) {
  return getBookType(item) === 'expense' ? getBookAdvanceInfo(item).personalExpense : safeNum(item?.amount);
}

function isBookSavingIncluded(item) {
  if (getBookType(item) !== 'saving') return false;
  return typeof item?.savingIncluded === 'boolean' ? item.savingIncluded : item?.cat !== 'transfer';
}

function getBookSavingAmount(item) {
  return isBookSavingIncluded(item) ? safeNum(item?.amount) : 0;
}

function getBookLineItems(item) {
  if (!Array.isArray(item?.lineItems)) return [];
  return item.lineItems.filter(line => line?.name && safeNum(line.amount) > 0);
}

function getBookCategoryAllocations(item) {
  const type = getBookType(item);
  const total = type === 'expense' ? getBookNetExpenseAmount(item) : safeNum(item?.amount);
  const lines = getBookLineItems(item);
  const lineTotal = lines.reduce((sum, line) => sum + safeNum(line.amount), 0);
  if (type !== 'expense' || !lines.length || lineTotal <= 0) {
    return [{ cat: item?.cat || 'other', subcat: getBookSubcategoryLabel(item), amount: total }];
  }
  const factor = total / lineTotal;
  return lines.map(line => ({
    cat: getBookCategoryMap('expense')[line.cat] ? line.cat : 'other',
    subcat: stripHtml(line.subcat || '', 40),
    amount: safeNum(line.amount) * factor,
  }));
}

function addBookCategoryAllocations(target, item) {
  for (const allocation of getBookCategoryAllocations(item)) {
    target[allocation.cat] = (target[allocation.cat] || 0) + allocation.amount;
  }
  return target;
}

function getBookDiscountInfo(item) {
  if (getBookType(item) !== 'expense') return { original: 0, paid: safeNum(item?.amount), discount: 0 };
  const paid = Math.max(0, safeNum(item?.amount));
  const original = safeNum(item?.originalAmount) > paid ? safeNum(item.originalAmount) : 0;
  return { original, paid, discount: original ? Math.max(0, original - paid) : 0 };
}

function getBookTypeMeta(type) {
  return BOOK_TYPES[normalizeBookType(type, 'income')];
}

function getBookCategories(type) {
  return buildBookCategories(type);
}

function getBookCategoryMap(type) {
  return Object.freeze(Object.fromEntries(getBookCategories(type).map(c => [c.id, c])));
}

function getBookCategory(item) {
  const type = getBookType(item);
  const map = getBookCategoryMap(type);
  return map[item.cat] || map.other;
}

function getMonthIncome(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return appState.income.filter(i => i.date?.startsWith(prefix));
}

function calcBookSummary(items) {
  const income = items
    .filter(i => getBookType(i) === 'income')
    .reduce((s, i) => s + safeNum(i.amount), 0);
  const expense = items
    .filter(i => getBookType(i) === 'expense')
    .reduce((s, i) => s + getBookNetExpenseAmount(i), 0);
  const saving = items
    .filter(i => getBookType(i) === 'saving')
    .reduce((s, i) => s + getBookSavingAmount(i), 0);
  const net = income - expense;
  const savingsRate = income > 0 ? (saving / income) * 100 : 0;
  return { income, expense, saving, net, savingsRate, count: items.length, savingCount: items.filter(isBookSavingIncluded).length };
}

function renderBookSummary(summary, prevSummary, netDelta) {
  const netCls = profitClass(summary.net);
  const expenseDelta = prevSummary.expense > 0 ? ((summary.expense - prevSummary.expense) / prevSummary.expense) * 100 : null;
  const incomeDelta = prevSummary.income > 0 ? ((summary.income - prevSummary.income) / prevSummary.income) * 100 : null;
  return `
    <div class="book-summary-grid" aria-label="이번 달 가계부 요약">
      <div class="book-summary-card">
        <span class="book-summary-label">수입</span>
        <strong class="book-summary-value income">${escHtml(fmtKRW(summary.income))}</strong>
        ${incomeDelta != null ? `<span class="book-summary-sub ${incomeDelta >= 0 ? 'positive' : 'negative'}">전월 ${escHtml(fmtPct(incomeDelta))}</span>` : '<span class="book-summary-sub">기록 없음</span>'}
      </div>
      <div class="book-summary-card">
        <span class="book-summary-label">지출</span>
        <strong class="book-summary-value negative">${escHtml(fmtKRW(summary.expense))}</strong>
        ${expenseDelta != null ? `<span class="book-summary-sub ${expenseDelta <= 0 ? 'positive' : 'negative'}">전월 ${escHtml(fmtPct(expenseDelta))}</span>` : '<span class="book-summary-sub">기록 없음</span>'}
      </div>
      <div class="book-summary-card book-summary-main">
        <span class="book-summary-label">순흐름</span>
        <strong class="book-summary-value ${netCls}">${summary.net >= 0 ? '+' : ''}${escHtml(fmtKRW(summary.net))}</strong>
        ${prevSummary.net !== 0 ? `<span class="book-summary-sub ${netDelta >= 0 ? 'positive' : 'negative'}">전월 대비 ${netDelta >= 0 ? '+' : ''}${escHtml(fmtKRW(netDelta))}</span>` : '<span class="book-summary-sub">수입 - 지출</span>'}
      </div>
      <div class="book-summary-card">
        <span class="book-summary-label">저축액</span>
        <strong class="book-summary-value saving">${escHtml(fmtKRW(summary.saving))}</strong>
        <span class="book-summary-sub">저축률 ${escHtml(fmtPct(summary.savingsRate, 1))} · ${summary.savingCount}건</span>
      </div>
    </div>
  `;
}

function renderBookToolbar(items) {
  const counts = {
    all: items.length,
    income: items.filter(i => getBookType(i) === 'income').length,
    expense: items.filter(i => getBookType(i) === 'expense').length,
    saving: items.filter(i => getBookType(i) === 'saving').length,
  };
  return `
    <div class="book-toolbar">
      <div class="book-tabs" role="tablist" aria-label="가계부 유형 필터">
        ${BOOK_FILTERS.map(f => `
          <button class="book-tab ${UIState.bookFilter === f.id ? 'active' : ''}"
            data-action="book-filter" data-filter="${escAttr(f.id)}"
            role="tab" aria-selected="${UIState.bookFilter === f.id ? 'true' : 'false'}">
            ${escHtml(f.label)} <span>${counts[f.id] || 0}</span>
          </button>
        `).join('')}
      </div>
      <div class="book-search-scope" role="radiogroup" aria-label="가계부 검색 범위">
        <button class="book-scope-btn ${UIState.bookSearchScope === 'month' ? 'active' : ''}"
          data-action="book-search-scope" data-scope="month" role="radio"
          aria-checked="${UIState.bookSearchScope === 'month'}">이번 달</button>
        <button class="book-scope-btn ${UIState.bookSearchScope === 'all' ? 'active' : ''}"
          data-action="book-search-scope" data-scope="all" role="radio"
          aria-checked="${UIState.bookSearchScope === 'all'}">전체 기간</button>
      </div>
      <div class="book-search-wrap">
        <input type="text" id="bookSearch" class="book-search" value="${escAttr(UIState.bookSearch || '')}"
          placeholder="${UIState.bookSearchScope === 'all' ? '전체 기간에서 검색' : '이번 달에서 검색'}" aria-label="가계부 내역 검색">
        ${UIState.bookSearch ? '<button class="search-clear" data-action="clear-book-search" aria-label="검색 초기화">✕</button>' : ''}
      </div>
    </div>
  `;
}

function filterBookItems(items) {
  let filtered = items.slice();
  if (['income', 'expense', 'saving'].includes(UIState.bookFilter)) {
    filtered = filtered.filter(i => getBookType(i) === UIState.bookFilter);
  }
  const q = (UIState.bookSearch || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(i => {
      const cat = getBookCategory(i);
      const lineText = getBookLineItems(i).map(line => {
        const lineCat = getBookCategoryMap('expense')[line.cat];
        return `${line.name || ''} ${lineCat?.label || ''} ${line.subcat || ''}`;
      }).join(' ');
      const accountText = `${getBookAccountLabel(i.fromAccount)} ${getBookAccountLabel(i.toAccount)}`;
      const text = `${i.source || ''} ${accountText} ${i.item || ''} ${i.memo || ''} ${cat.label} ${getBookSubcategoryLabel(i)} ${i.payment || ''} ${lineText}`.toLowerCase();
      return text.includes(q);
    });
  }
  return filtered;
}

function setBookFilter(filter) {
  UIState.bookFilter = ['all', 'income', 'expense', 'saving'].includes(filter) ? filter : 'all';
  renderIncome();
}

function clearBookSearch() {
  UIState.bookSearch = '';
  renderIncome();
}

function calcBookSpendingAnalysis(items) {
  const expenses = items.filter(item => getBookType(item) === 'expense');
  const result = {
    total: 0,
    fixed: 0,
    variable: 0,
    essential: 0,
    optional: 0,
    fixedEssential: 0,
    fixedOptional: 0,
    variableEssential: 0,
    variableOptional: 0,
  };
  for (const item of expenses) {
    const amount = getBookNetExpenseAmount(item);
    const traits = getBookSpendingTraits(item);
    result.total += amount;
    result[traits.costType] += amount;
    result[traits.needType] += amount;
    const quadrant = `${traits.costType}${traits.needType[0].toUpperCase()}${traits.needType.slice(1)}`;
    result[quadrant] += amount;
  }
  return result;
}

function renderBookSpendingBar(label, value, total, cls) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return `<div class="book-trait-stat">
    <div><span>${escHtml(label)}</span><strong>${escHtml(fmtKRW(value))} <em>${pct.toFixed(1)}%</em></strong></div>
    <div class="book-trait-bar"><span class="${cls}" style="width:${Math.min(100, Math.max(0, pct))}%"></span></div>
  </div>`;
}

function renderBookSpendingAnalysis(items) {
  const data = calcBookSpendingAnalysis(items);
  if (!data.total) return '';
  const quadrants = [
    ['고정비 · 필수', data.fixedEssential, 'fixed-essential'],
    ['고정비 · 선택', data.fixedOptional, 'fixed-optional'],
    ['변동비 · 필수', data.variableEssential, 'variable-essential'],
    ['변동비 · 선택', data.variableOptional, 'variable-optional'],
  ];
  return `<div class="card book-trait-analysis stagger-item" style="--i:2" aria-label="지출 성격 분석">
    <div class="card-title">
      지출 성격 분석
      <span class="book-trait-analysis-total">총 ${escHtml(fmtKRW(data.total))}</span>
    </div>
    <div class="book-trait-dimensions">
      <section>
        <h4>고정비와 변동비</h4>
        ${renderBookSpendingBar('고정비', data.fixed, data.total, 'fixed')}
        ${renderBookSpendingBar('변동비', data.variable, data.total, 'variable')}
      </section>
      <section>
        <h4>필수와 선택</h4>
        ${renderBookSpendingBar('필수', data.essential, data.total, 'essential')}
        ${renderBookSpendingBar('선택', data.optional, data.total, 'optional')}
      </section>
    </div>
    <div class="book-trait-quadrants">
      ${quadrants.map(([label, value, cls]) => `<div class="${cls}"><span>${label}</span><strong>${escHtml(fmtKRW(value))}</strong></div>`).join('')}
    </div>
    ${data.variableOptional || data.fixedOptional ? `<div class="book-trait-tip">먼저 살펴볼 수 있는 선택지출은 <strong>${escHtml(fmtKRW(data.variableOptional + data.fixedOptional))}</strong>이에요.</div>` : ''}
  </div>`;
}

function calcBookPaymentAnalysis(items) {
  const totals = Object.fromEntries(Object.keys(BOOK_PAYMENT_KINDS).map(kind => [kind, 0]));
  const byMethod = {};
  let unassigned = 0;
  let discountTotal = 0;
  let discountCount = 0;
  for (const item of items) {
    if (getBookType(item) !== 'expense') continue;
    const amount = getBookNetExpenseAmount(item);
    const discount = getBookDiscountInfo(item);
    if (discount.discount > 0) { discountTotal += discount.discount; discountCount++; }
    if (!item.payment) unassigned += amount;
    else {
      const kind = inferBookPaymentKind(item.payment);
      totals[kind] += amount;
      if (!byMethod[item.payment]) byMethod[item.payment] = { label: item.payment, kind, amount: 0, count: 0 };
      byMethod[item.payment].amount += amount;
      byMethod[item.payment].count += 1;
    }
  }
  return {
    totals,
    byMethod: Object.values(byMethod).sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, 'ko')),
    unassigned,
    discountTotal,
    discountCount,
    total: Object.values(totals).reduce((sum, value) => sum + value, 0),
  };
}

function renderBookPaymentAnalysis(items) {
  const data = calcBookPaymentAnalysis(items);
  if (!data.total && !data.discountTotal) return '';
  const cardTotal = data.totals.credit + data.totals.debit;
  const rows = Object.entries(BOOK_PAYMENT_KINDS)
    .map(([kind, meta]) => ({ kind, label: meta.label, amount: data.totals[kind] }))
    .filter(row => row.amount > 0);
  return `<div class="card book-payment-analysis stagger-item" style="--i:3" aria-label="결제 수단 분석">
    <div class="card-title">결제 수단 분석 <span class="book-trait-analysis-total">지정된 지출 ${escHtml(fmtKRW(data.total))}</span></div>
    <div class="book-card-type-summary">
      <div class="credit"><span>신용카드</span><strong>${escHtml(fmtKRW(data.totals.credit))}</strong><small>${cardTotal ? ((data.totals.credit / cardTotal) * 100).toFixed(1) : '0.0'}%</small></div>
      <div class="debit"><span>체크카드</span><strong>${escHtml(fmtKRW(data.totals.debit))}</strong><small>${cardTotal ? ((data.totals.debit / cardTotal) * 100).toFixed(1) : '0.0'}%</small></div>
    </div>
    <div class="book-payment-kind-list">
      ${rows.map(row => `<div><span>${escHtml(row.label)}</span><strong>${escHtml(fmtKRW(row.amount))}</strong></div>`).join('')}
    </div>
    ${data.byMethod.length ? `<div class="book-payment-method-breakdown">
      <div class="book-payment-method-title">카드·결제수단별</div>
      ${data.byMethod.map(method => {
        const pct = data.total ? (method.amount / data.total) * 100 : 0;
        return `<div class="book-payment-method-stat ${escAttr(method.kind)}">
          <div class="book-payment-method-stat-head">
            <span>${escHtml(method.label)} <small>${escHtml(BOOK_PAYMENT_KINDS[method.kind]?.short || '기타')}</small></span>
            <strong>${escHtml(fmtKRW(method.amount))}</strong>
            <em>${method.count}건 · ${pct.toFixed(1)}%</em>
          </div>
          <div class="book-payment-method-track" aria-hidden="true"><i style="width:${Math.max(2, pct).toFixed(1)}%"></i></div>
        </div>`;
      }).join('')}
    </div>` : ''}
    ${data.unassigned ? `<div class="book-payment-unassigned">결제 수단 미지정 지출 ${escHtml(fmtKRW(data.unassigned))}</div>` : ''}
    ${data.discountTotal ? `<div class="book-discount-summary"><span>할인·쿠폰 참고액</span><strong>${escHtml(fmtKRW(data.discountTotal))}</strong><small>${data.discountCount}건 · 실제 지출 합계에는 포함하지 않아요</small></div>` : ''}
    <div class="book-payment-tax-note">카드 유형별 금액을 모아 두면 나중에 연말정산 소비 비중을 확인하기 쉬워요.</div>
  </div>`;
}

function getPointEntryDelta(entry) {
  const amount = Math.max(0, safeNum(entry?.amount));
  return ['used', 'expired'].includes(entry?.type) ? -amount : amount;
}

function calcBookPointLedger(year, month, view = 'month') {
  const cleanView = ['year', 'all'].includes(view) ? view : 'month';
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const yearPrefix = `${year}-`;
  const endDate = cleanView === 'all'
    ? '9999-12-31'
    : cleanView === 'year'
    ? `${year}-12-31`
    : `${monthPrefix}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  const all = (Array.isArray(appState.pointEntries) ? appState.pointEntries : [])
    .filter(entry => entry.provider && safeNum(entry.amount) > 0);
  const periodEntries = all.filter(entry => cleanView === 'all'
    ? true
    : cleanView === 'year' ? entry.date?.startsWith(yearPrefix) : entry.date?.startsWith(monthPrefix));
  const throughPeriod = all.filter(entry => (entry.date || '') <= endDate);
  const providers = new Map();
  const ensure = provider => {
    if (!providers.has(provider)) providers.set(provider, { provider, earned: 0, used: 0, expired: 0, adjusted: 0, balance: 0 });
    return providers.get(provider);
  };
  for (const entry of throughPeriod) ensure(entry.provider).balance += getPointEntryDelta(entry);
  for (const entry of periodEntries) {
    const row = ensure(entry.provider);
    row[entry.type] += safeNum(entry.amount);
  }
  const rows = [...providers.values()]
    .filter(row => row.balance !== 0 || row.earned || row.used || row.expired || row.adjusted)
    .sort((a, b) => b.balance - a.balance || a.provider.localeCompare(b.provider, 'ko'));
  return {
    view: cleanView,
    label: cleanView === 'all' ? '전체 기간' : cleanView === 'year' ? `${year}년 연간` : `${year}년 ${month}월`,
    entries: periodEntries.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.id).localeCompare(String(a.id))),
    rows,
    earned: periodEntries.filter(entry => entry.type === 'earned').reduce((sum, entry) => sum + safeNum(entry.amount), 0),
    used: periodEntries.filter(entry => entry.type === 'used').reduce((sum, entry) => sum + safeNum(entry.amount), 0),
    expired: periodEntries.filter(entry => entry.type === 'expired').reduce((sum, entry) => sum + safeNum(entry.amount), 0),
    balance: rows.reduce((sum, row) => sum + row.balance, 0),
  };
}

function renderBookPointLedger(year, month) {
  const data = calcBookPointLedger(year, month, UIState.pointLedgerView);
  const duplicateCounts = new Map();
  for (const entry of data.entries) {
    const key = [entry.provider, entry.type, safeNum(entry.amount), entry.date, entry.memo || ''].join('|');
    duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
  }
  const summary = [
    ['적립', data.earned, 'earned'],
    ['사용', data.used, 'used'],
    ['소멸', data.expired, 'expired'],
    ['현재 잔액', data.balance, 'balance'],
  ];
  return `<div class="card book-point-ledger stagger-item" style="--i:4" aria-label="포인트 장부">
    <div class="card-title book-point-title">
      <span>포인트 장부 <small>수입·지출 합계에서 제외</small></span>
      <button class="btn-p" data-action="open-add-point-entry" aria-label="포인트 내역 추가">+ 포인트 내역</button>
    </div>
    <div class="book-point-toolbar">
      <strong>${escHtml(data.label)}</strong>
      <div class="book-point-tabs" role="radiogroup" aria-label="포인트 조회 기간">
        <button data-action="point-ledger-view" data-view="month" role="radio" aria-checked="${data.view === 'month'}" class="${data.view === 'month' ? 'active' : ''}">월간</button>
        <button data-action="point-ledger-view" data-view="year" role="radio" aria-checked="${data.view === 'year'}" class="${data.view === 'year' ? 'active' : ''}">연간</button>
        <button data-action="point-ledger-view" data-view="all" role="radio" aria-checked="${data.view === 'all'}" class="${data.view === 'all' ? 'active' : ''}">전체</button>
      </div>
    </div>
    <div class="book-point-summary">
      ${summary.map(([label, value, cls]) => `<div class="${cls}"><span>${label}</span><strong>${escHtml(fmtKRW(value))}</strong></div>`).join('')}
    </div>
    ${data.rows.length ? `<div class="book-point-content">
      <div class="book-point-providers">
        <div class="book-point-section-title">포인트별 현황</div>
        <div class="book-point-provider book-point-provider-head"><span>포인트</span><span>적립·조정</span><span>사용</span><span>소멸</span><span>잔액</span></div>
        ${data.rows.map(row => `<div class="book-point-provider">
          <strong>${escHtml(row.provider)}</strong>
          <span>${escHtml(fmtKRW(row.earned + row.adjusted))}</span>
          <span>${escHtml(fmtKRW(row.used))}</span>
          <span>${escHtml(fmtKRW(row.expired))}</span>
          <strong>${escHtml(fmtKRW(row.balance))}</strong>
        </div>`).join('')}
      </div>
      <div class="book-point-recent">
        <div class="book-point-section-title">포인트 내역 <small>${data.entries.length}건 · 모두 표시</small></div>
        <div class="book-point-entry-scroll">
        ${data.entries.length ? data.entries.map(entry => {
          const meta = POINT_ENTRY_TYPES[entry.type] || POINT_ENTRY_TYPES.earned;
          const duplicateKey = [entry.provider, entry.type, safeNum(entry.amount), entry.date, entry.memo || ''].join('|');
          const isDuplicate = (duplicateCounts.get(duplicateKey) || 0) > 1;
          return `<div class="book-point-entry ${meta.cls} ${isDuplicate ? 'is-duplicate' : ''}">
            <time datetime="${escAttr(entry.date)}">${escHtml(entry.date.slice(5).replace('-', '.'))}</time>
            <span><strong>${escHtml(entry.provider)}${isDuplicate ? ' <em class="book-point-duplicate-badge">중복 의심</em>' : ''}</strong><small>${escHtml(meta.label)}${entry.memo ? ` · ${escHtml(entry.memo)}` : ''}</small></span>
            <b>${meta.sign}${escHtml(fmtKRW(entry.amount))}</b>
            <button data-action="edit-point-entry" data-id="${escAttr(entry.id)}" aria-label="${escAttr(entry.provider)} 포인트 내역 수정">✎</button>
            <button data-action="delete-point-entry" data-id="${escAttr(entry.id)}" aria-label="${escAttr(entry.provider)} 포인트 내역 삭제">✕</button>
          </div>`;
        }).join('') : '<div class="book-point-period-empty">이 기간에는 포인트 변동이 없어요.</div>'}
        </div>
      </div>
    </div>` : `<div class="book-point-empty">
      <strong>아직 포인트 기록이 없어요</strong>
      <span>적립·사용·소멸을 남기면 월간과 연간으로 모아볼 수 있어요.</span>
    </div>`}
  </div>`;
}

function getPointProviderSuggestions() {
  const hidden = new Set(loadPresets().hiddenPointProviders || []);
  return [...new Set((appState.pointEntries || []).map(entry => stripHtml(entry.provider || '', 40)).filter(Boolean))]
    .filter(value => !hidden.has(value))
    .sort((a, b) => a.localeCompare(b, 'ko'));
}

function renderRememberedSuggestionList(kind) {
  const list = kind === 'pointProviders'
    ? getPointProviderSuggestions()
    : (loadPresets()[kind] || []);
  return `<div class="remembered-suggestion-list ${list.length ? '' : 'is-empty'}">
    ${list.length ? list.map(value => `<span><b>${escHtml(value)}</b><button type="button" data-action="delete-remembered-suggestion" data-kind="${escAttr(kind)}" data-value="${escAttr(value)}" aria-label="${escAttr(value)} 자동완성에서 삭제">✕</button></span>`).join('') : '저장된 자동완성 항목이 없어요.'}
    ${list.length ? '<small>여기서 지워도 이미 작성한 가계부·포인트 기록은 그대로 남아요.</small>' : ''}
  </div>`;
}

function toggleRememberedSuggestions(target) {
  const kind = target.dataset.kind || '';
  const manager = $(`[data-suggestion-kind="${kind}"]`, target.closest('.modal') || document);
  if (!manager) return;
  manager.classList.toggle('hidden');
  target.textContent = manager.classList.contains('hidden') ? '목록 관리' : '목록 닫기';
}

function deleteRememberedSuggestion(target) {
  const kind = target.dataset.kind || '';
  const value = stripHtml(target.dataset.value || '', 50);
  if (!value) return;
  if (kind === 'pointProviders') hidePointProviderSuggestion(value);
  else removePreset(kind, value);
  const manager = target.closest('.remembered-suggestion-manager');
  if (manager) manager.innerHTML = renderRememberedSuggestionList(kind);
  if (kind === 'pointProviders') {
    const datalist = $('#pointProviderSuggestions');
    if (datalist) datalist.innerHTML = getPointProviderSuggestions().map(item => `<option value="${escAttr(item)}"></option>`).join('');
  } else {
    const expenseList = $('#expenseSourcePresets');
    const incomeList = $('#incomeSourcePresets');
    if (expenseList) expenseList.innerHTML = (loadPresets().expenseSources || []).map(item => `<option value="${escAttr(item)}"></option>`).join('');
    if (incomeList) incomeList.innerHTML = (loadPresets().incomeSources || []).map(item => `<option value="${escAttr(item)}"></option>`).join('');
  }
  showToast('자동완성 목록에서 지웠어요. 기존 기록은 그대로예요.', 'success');
}

function openPointEntryModal(id = '') {
  const item = id ? (appState.pointEntries || []).find(entry => entry.id === id) : null;
  const type = POINT_ENTRY_TYPES[item?.type] ? item.type : 'earned';
  const container = $('#modalSub');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-box-sm">
      <div class="modal-header">
        <h3>${item ? '포인트 내역 수정' : '포인트 내역 추가'}</h3>
        <button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="book-point-form-note">포인트 기록은 가계부 수입·지출 합계에 포함되지 않아요.</div>
        <div class="form-group">
          <div class="form-label-with-action"><label for="pointProvider">포인트 이름 *</label><button type="button" class="form-label-edit" data-action="toggle-remembered-suggestions" data-kind="pointProviders">목록 관리</button></div>
          <input type="text" id="pointProvider" value="${escAttr(item?.provider || '')}" placeholder="예: 이머니, 네이버페이" maxlength="40" list="pointProviderSuggestions">
          <datalist id="pointProviderSuggestions">${getPointProviderSuggestions().map(value => `<option value="${escAttr(value)}"></option>`).join('')}</datalist>
          <div class="remembered-suggestion-manager hidden" data-suggestion-kind="pointProviders">${renderRememberedSuggestionList('pointProviders')}</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="pointEntryType">구분 *</label>
            <select id="pointEntryType">
              ${Object.entries(POINT_ENTRY_TYPES).map(([value, meta]) => `<option value="${value}" ${value === type ? 'selected' : ''}>${escHtml(meta.label)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="pointEntryAmount">금액 *</label>
            <input type="number" inputmode="decimal" id="pointEntryAmount" value="${item ? escAttr(item.amount) : ''}" min="0" placeholder="0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="pointEntryDate">날짜 *</label>
            <input type="date" id="pointEntryDate" value="${escAttr(item?.date || today())}">
          </div>
          <div class="form-group">
            <label for="pointEntryMemo">메모</label>
            <input type="text" id="pointEntryMemo" value="${escAttr(item?.memo || '')}" placeholder="예: 구매 적립" maxlength="160">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-s" data-action="close-sub-modal">취소</button>
          <button class="btn-p" data-action="save-point-entry" data-id="${escAttr(item?.id || '')}">${item ? '저장' : '추가'}</button>
        </div>
      </div>
    </div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'save-point-entry') doSavePointEntry(target.dataset.id || '');
    else if (action === 'toggle-remembered-suggestions') toggleRememberedSuggestions(target);
    else if (action === 'delete-remembered-suggestion') deleteRememberedSuggestion(target);
  });
  requestAnimationFrame(() => $('#pointProvider', container)?.focus());
}

function doSavePointEntry(id = '') {
  if (_pointEntrySaving) return;
  const provider = stripHtml($('#pointProvider')?.value || '', 40);
  const type = POINT_ENTRY_TYPES[$('#pointEntryType')?.value] ? $('#pointEntryType').value : 'earned';
  const amount = Math.max(0, safeNum($('#pointEntryAmount')?.value));
  const date = $('#pointEntryDate')?.value || today();
  const memo = stripHtml($('#pointEntryMemo')?.value || '', 160);
  if (!provider) { showToast('포인트 이름을 입력하세요', 'error'); return; }
  if (amount <= 0) { showToast('포인트 금액을 입력하세요', 'error'); return; }
  _pointEntrySaving = true;
  const saveButton = $('[data-action="save-point-entry"]', $('#modalSub'));
  if (saveButton) saveButton.disabled = true;
  const values = { provider, type, amount, date, memo };
  restorePointProviderSuggestion(provider);
  if (id) updatePointEntry(id, values);
  else addPointEntry(values);
  closeModal('modalSub');
  showToast(`포인트 ${POINT_ENTRY_TYPES[type].label} 내역이 ${id ? '수정' : '추가'}되었습니다`, 'success');
  renderIncome();
  setTimeout(() => { _pointEntrySaving = false; }, 600);
}

function doDeletePointEntry(id) {
  const entry = (appState.pointEntries || []).find(item => item.id === id);
  if (!entry) return;
  openConfirmModal(`${entry.provider} 포인트 내역을 삭제할까요?`, () => {
    deletePointEntry(id);
    showToast('포인트 내역이 삭제되었습니다', 'success');
    renderIncome();
  });
}

function getGifticonEffectiveStatus(item) {
  if (item?.status !== 'unused') return GIFTICON_STATUSES[item?.status] ? item.status : 'unused';
  return item.expiresDate && item.expiresDate < today() ? 'expired' : 'unused';
}

function calcGifticonWallet(year, month) {
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const items = (Array.isArray(appState.gifticons) ? appState.gifticons : [])
    .filter(item => item.name || item.brand)
    .map(item => ({ ...item, effectiveStatus: getGifticonEffectiveStatus(item) }));
  const unused = items.filter(item => item.effectiveStatus === 'unused');
  const expiryLimit = new Date();
  expiryLimit.setDate(expiryLimit.getDate() + 30);
  const expiryLimitText = `${expiryLimit.getFullYear()}-${String(expiryLimit.getMonth() + 1).padStart(2, '0')}-${String(expiryLimit.getDate()).padStart(2, '0')}`;
  const expiring = unused.filter(item => item.expiresDate && item.expiresDate >= today() && item.expiresDate <= expiryLimitText);
  const usedThisMonth = items.filter(item => item.effectiveStatus === 'used' && item.completedDate?.startsWith(monthPrefix));
  return {
    items: items.sort((a, b) => {
      const rank = status => status === 'unused' ? 0 : status === 'used' ? 1 : status === 'sold' ? 2 : 3;
      return rank(a.effectiveStatus) - rank(b.effectiveStatus)
        || (a.expiresDate || '9999-12-31').localeCompare(b.expiresDate || '9999-12-31')
        || (b.receivedDate || '').localeCompare(a.receivedDate || '');
    }),
    unusedCount: unused.length,
    balance: unused.reduce((sum, item) => sum + safeNum(item.faceValue), 0),
    expiringCount: expiring.length,
    usedMonthTotal: usedThisMonth.reduce((sum, item) => sum + safeNum(item.faceValue), 0),
  };
}

function renderGifticonWallet(year, month) {
  const data = calcGifticonWallet(year, month);
  return `<div class="card gifticon-wallet stagger-item" style="--i:5" aria-label="기프티콘 상품권 지갑">
    <div class="card-title gifticon-wallet-title">
      <span>기프티콘·상품권 지갑 <small>수입·지출 합계에서 제외</small></span>
      <button class="btn-p" data-action="open-add-gifticon" aria-label="기프티콘 추가">+ 기프티콘</button>
    </div>
    <div class="gifticon-summary">
      <div><span>사용 가능</span><strong>${data.unusedCount}개</strong></div>
      <div><span>사용 가능 금액</span><strong>${escHtml(fmtKRW(data.balance))}</strong></div>
      <div class="${data.expiringCount ? 'attention' : ''}"><span>30일 이내 만료</span><strong>${data.expiringCount}개</strong></div>
      <div><span>${month}월 사용</span><strong>${escHtml(fmtKRW(data.usedMonthTotal))}</strong></div>
    </div>
    ${data.items.length ? `<div class="gifticon-list">
      ${data.items.map(item => {
        const status = GIFTICON_STATUSES[item.effectiveStatus] || GIFTICON_STATUSES.unused;
        const source = GIFTICON_SOURCES[item.source] || GIFTICON_SOURCES.gift;
        return `<div class="gifticon-item ${status.cls}">
          <div class="gifticon-main">
            <div class="gifticon-name"><strong>${escHtml(item.name || item.brand)}</strong>${item.brand && item.name ? `<small>${escHtml(item.brand)}</small>` : ''}</div>
            <div class="gifticon-meta">
              <span class="gifticon-source">${escHtml(source.short)}</span>
              <span>${item.expiresDate ? `유효기간 ${escHtml(item.expiresDate.replaceAll('-', '.'))}` : '유효기간 없음'}</span>
              ${item.memo ? `<span>${escHtml(item.memo)}</span>` : ''}
            </div>
          </div>
          <div class="gifticon-value"><strong>${escHtml(fmtKRW(item.faceValue))}</strong><span class="gifticon-status ${status.cls}">${escHtml(status.label)}</span></div>
          <div class="gifticon-actions">
            ${item.effectiveStatus === 'unused' ? `<button class="btn-sm" data-action="use-gifticon" data-id="${escAttr(item.id)}">사용</button>` : ''}
            <button class="btn-icon" data-action="edit-gifticon" data-id="${escAttr(item.id)}" aria-label="${escAttr(item.name || item.brand)} 수정">✎</button>
            <button class="btn-icon btn-danger" data-action="delete-gifticon" data-id="${escAttr(item.id)}" aria-label="${escAttr(item.name || item.brand)} 삭제">✕</button>
          </div>
        </div>`;
      }).join('')}
    </div>` : `<div class="gifticon-empty"><strong>보관 중인 기프티콘이 없어요</strong><span>받거나 구매한 기프티콘을 등록하면 유효기간과 사용 여부를 관리할 수 있어요.</span></div>`}
    <div class="gifticon-guide">직접 구매한 금액, 사용 시 추가 결제액, 판매 후 입금액은 해당 시점에 가계부 내역으로 따로 기록해요.</div>
  </div>`;
}

function openGifticonModal(id = '') {
  const stored = id ? (appState.gifticons || []).find(item => item.id === id) : null;
  const item = stored ? { ...stored, status: getGifticonEffectiveStatus(stored) } : null;
  const source = GIFTICON_SOURCES[item?.source] ? item.source : 'gift';
  const status = GIFTICON_STATUSES[item?.status] ? item.status : 'unused';
  const container = $('#modalSub');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box gifticon-modal">
      <div class="modal-header">
        <h3>${item ? '기프티콘 수정' : '기프티콘 추가'}</h3>
        <button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="gifticon-form-note">지갑 기록은 수입·지출 합계에 포함되지 않아요.</div>
        <div class="form-row">
          <div class="form-group"><label for="gifticonBrand">브랜드</label><input type="text" id="gifticonBrand" value="${escAttr(item?.brand || '')}" placeholder="예: 스타벅스" maxlength="40"></div>
          <div class="form-group"><label for="gifticonName">상품명 *</label><input type="text" id="gifticonName" value="${escAttr(item?.name || '')}" placeholder="예: 카페 아메리카노 T" maxlength="100"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="gifticonFaceValue">상품 금액 *</label><input type="number" inputmode="decimal" id="gifticonFaceValue" value="${item ? escAttr(item.faceValue) : ''}" min="0" placeholder="0"></div>
          <div class="form-group"><label for="gifticonSource">받은 방법 *</label><select id="gifticonSource">${Object.entries(GIFTICON_SOURCES).map(([value, meta]) => `<option value="${value}" ${value === source ? 'selected' : ''}>${escHtml(meta.label)}</option>`).join('')}</select></div>
        </div>
        <div id="gifticonPurchasePriceBlock" class="form-group ${source === 'purchased' ? '' : 'hidden'}"><label for="gifticonPurchasePrice">실제 구매금액 *</label><input type="number" inputmode="decimal" id="gifticonPurchasePrice" value="${item?.purchasePrice ? escAttr(item.purchasePrice) : ''}" min="0" placeholder="예: 9000"></div>
        <div class="form-row">
          <div class="form-group"><label for="gifticonReceivedDate">받은·구매한 날 *</label><input type="date" id="gifticonReceivedDate" value="${escAttr(item?.receivedDate || today())}"></div>
          <div class="form-group"><label for="gifticonExpiresDate">유효기간</label><input type="date" id="gifticonExpiresDate" value="${escAttr(item?.expiresDate || '')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="gifticonStatus">상태 *</label><select id="gifticonStatus">${Object.entries(GIFTICON_STATUSES).map(([value, meta]) => `<option value="${value}" ${value === status ? 'selected' : ''}>${escHtml(meta.label)}</option>`).join('')}</select></div>
          <div id="gifticonCompletedDateBlock" class="form-group ${status === 'unused' ? 'hidden' : ''}"><label for="gifticonCompletedDate">처리한 날</label><input type="date" id="gifticonCompletedDate" value="${escAttr(item?.completedDate || today())}"></div>
        </div>
        <div id="gifticonSaleAmountBlock" class="form-group ${status === 'sold' ? '' : 'hidden'}"><label for="gifticonSaleAmount">판매 입금액 *</label><input type="number" inputmode="decimal" id="gifticonSaleAmount" value="${item?.saleAmount ? escAttr(item.saleAmount) : ''}" min="0" placeholder="0"></div>
        <div class="form-group"><label for="gifticonMemo">메모</label><input type="text" id="gifticonMemo" value="${escAttr(item?.memo || '')}" placeholder="필요한 설명이 있을 때만 입력하세요" maxlength="160"></div>
        <div class="modal-actions">
          <button class="btn-s" data-action="close-sub-modal">취소</button>
          <button class="btn-p" data-action="save-gifticon" data-id="${escAttr(item?.id || '')}">${item ? '저장' : '추가'}</button>
        </div>
      </div>
    </div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'save-gifticon') doSaveGifticon(target.dataset.id || '');
  });
  const syncGifticonFields = () => {
    const nextSource = $('#gifticonSource', container)?.value;
    const nextStatus = $('#gifticonStatus', container)?.value;
    $('#gifticonPurchasePriceBlock', container)?.classList.toggle('hidden', nextSource !== 'purchased');
    $('#gifticonCompletedDateBlock', container)?.classList.toggle('hidden', nextStatus === 'unused');
    $('#gifticonSaleAmountBlock', container)?.classList.toggle('hidden', nextStatus !== 'sold');
  };
  _modalCleanup.add($('#gifticonSource', container), 'change', syncGifticonFields);
  _modalCleanup.add($('#gifticonStatus', container), 'change', syncGifticonFields);
  requestAnimationFrame(() => $('#gifticonName', container)?.focus());
}

function doSaveGifticon(id = '') {
  const brand = stripHtml($('#gifticonBrand')?.value || '', 40);
  const name = stripHtml($('#gifticonName')?.value || '', 100);
  const faceValue = Math.max(0, safeNum($('#gifticonFaceValue')?.value));
  const source = GIFTICON_SOURCES[$('#gifticonSource')?.value] ? $('#gifticonSource').value : 'gift';
  const purchasePrice = source === 'purchased' ? Math.max(0, safeNum($('#gifticonPurchasePrice')?.value)) : 0;
  const status = GIFTICON_STATUSES[$('#gifticonStatus')?.value] ? $('#gifticonStatus').value : 'unused';
  const saleAmount = status === 'sold' ? Math.max(0, safeNum($('#gifticonSaleAmount')?.value)) : 0;
  if (!name) { showToast('기프티콘 상품명을 입력하세요', 'error'); return; }
  if (faceValue <= 0) { showToast('기프티콘 상품 금액을 입력하세요', 'error'); return; }
  if (source === 'purchased' && purchasePrice <= 0) { showToast('실제 구매금액을 입력하세요', 'error'); return; }
  if (status === 'sold' && saleAmount <= 0) { showToast('판매 입금액을 입력하세요', 'error'); return; }
  const values = {
    brand, name, faceValue, source, purchasePrice, status, saleAmount,
    receivedDate: $('#gifticonReceivedDate')?.value || today(),
    expiresDate: $('#gifticonExpiresDate')?.value || '',
    completedDate: status === 'unused' ? '' : ($('#gifticonCompletedDate')?.value || today()),
    memo: stripHtml($('#gifticonMemo')?.value || '', 160),
  };
  if (id) updateGifticon(id, values);
  else addGifticon(values);
  closeModal('modalSub');
  showToast(`기프티콘이 ${id ? '수정' : '추가'}되었습니다`, 'success');
  renderIncome();
}

function doUseGifticon(id) {
  const item = (appState.gifticons || []).find(value => value.id === id);
  if (!item) return;
  openConfirmModal(`${item.name || item.brand}을 사용 완료로 바꿀까요?\n추가로 결제한 금액이 있다면 가계부 지출에 따로 기록해 주세요.`, () => {
    updateGifticon(id, { status: 'used', completedDate: today(), saleAmount: 0 });
    showToast('기프티콘을 사용 완료로 변경했습니다', 'success');
    renderIncome();
  });
}

function doDeleteGifticon(id) {
  const item = (appState.gifticons || []).find(value => value.id === id);
  if (!item) return;
  openConfirmModal(`${item.name || item.brand} 기프티콘을 삭제할까요?`, () => {
    deleteGifticon(id);
    showToast('기프티콘이 삭제되었습니다', 'success');
    renderIncome();
  });
}

function getDefaultBookSpendingTraits(type, catId, subcat = '', recurring = false) {
  if (type !== 'expense') return { costType: '', needType: '' };
  const category = getBookCategoryMap('expense')[catId] || getBookCategoryMap('expense').other;
  const text = `${catId || ''} ${category?.label || ''} ${subcat || ''}`.toLowerCase();
  const fixedIds = new Set(['housing', 'tax']);
  const optionalIds = new Set(['cafe', 'shopping', 'travel']);
  const fixedPattern = /월세|관리비|공과|통신|휴대폰|인터넷|보험|구독|멤버십|정기|세금|대출.?이자|chat.?gpt|유튜브|쿠팡|네이버플러스|말해보카/;
  const optionalPattern = /카페|간식|외식|배달|여행|문화|취미|영화|공연|화장품|스킨케어|미용|의류|잡화|선물|데이트|모임|구독|멤버십|유흥|게임|굿즈/;
  const essentialPattern = /주거|공과|통신|보험|세금|병원|약국|의료|교통|장보기|주방|욕실|청소|세탁|가족.?지원|생활지원/;
  const costType = recurring || fixedIds.has(catId) || fixedPattern.test(text) ? 'fixed' : 'variable';
  let needType = optionalIds.has(catId) || optionalPattern.test(text) ? 'optional' : 'essential';
  if (!optionalPattern.test(text) && essentialPattern.test(text)) needType = 'essential';
  return { costType, needType };
}

function getBookSpendingTraits(item) {
  if (getBookType(item) !== 'expense') return { costType: '', needType: '' };
  const defaults = getDefaultBookSpendingTraits('expense', item.cat, getBookSubcategoryLabel(item), !!getBookRepeatCycle(item));
  return {
    costType: ['fixed', 'variable'].includes(item.costType) ? item.costType : defaults.costType,
    needType: ['essential', 'optional'].includes(item.needType) ? item.needType : defaults.needType,
  };
}

function getBookTraitMeta(field, value) {
  const meta = {
    costType: {
      fixed: { label: '고정비', cls: 'fixed' },
      variable: { label: '변동비', cls: 'variable' },
    },
    needType: {
      essential: { label: '필수', cls: 'essential' },
      optional: { label: '선택', cls: 'optional' },
    },
  };
  return meta[field]?.[value] || { label: '', cls: '' };
}

function openBookYearReview() {
  _bookYearReviewYear = Number(UIState.incomeMonth?.slice(0, 4)) || new Date().getFullYear();
  _bookYearReviewShowSubcats = false;
  _bookYearReviewOpen = true;
  renderIncome();
}

function getBookYearReviewValues(items, matcher, amountGetter = item => safeNum(item.amount)) {
  const values = Array(12).fill(0);
  for (const item of items) {
    if (!matcher(item)) continue;
    const month = Number((item.date || '').slice(5, 7));
    if (month >= 1 && month <= 12) values[month - 1] += amountGetter(item);
  }
  return values;
}

function formatBookYearReviewAmount(value) {
  const rounded = Math.round(safeNum(value));
  if (!rounded) return '-';
  return `${rounded < 0 ? '-' : ''}${Math.abs(rounded).toLocaleString('ko-KR')}`;
}

function renderBookYearReviewRow(label, values, options = {}) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / 12;
  const rowClass = [options.className || '', options.kind ? `is-${options.kind}` : '', options.sub ? 'is-sub' : ''].filter(Boolean).join(' ');
  const cells = [...values, total, average].map((value, index) => {
    const text = formatBookYearReviewAmount(value);
    const title = text === '-' ? '기록 없음' : `${index < 12 ? `${index + 1}월` : index === 12 ? '합계' : '월평균'} ${Math.round(value).toLocaleString('ko-KR')}원`;
    return `<td class="${index >= 12 ? 'is-summary' : ''}" title="${escAttr(title)}">${escHtml(text)}</td>`;
  }).join('');
  return `<tr class="${rowClass}"><th scope="row"><span class="book-year-row-label">${options.icon ? `${escHtml(options.icon)} ` : ''}${escHtml(label)}</span></th>${cells}</tr>`;
}

function buildBookYearReviewRows(year) {
  const prefix = `${year}-`;
  const items = appState.income.filter(item => (item.date || '').startsWith(prefix));
  const expenseMap = getBookCategoryMap('expense');
  const expenseCategoryId = item => expenseMap[item.cat] ? item.cat : 'other';
  const incomeValues = getBookYearReviewValues(items, item => getBookType(item) === 'income');
  const expensePositive = getBookYearReviewValues(items, item => getBookType(item) === 'expense', getBookNetExpenseAmount);
  const expenseValues = expensePositive.map(value => -value);
  const savingValues = getBookYearReviewValues(items, isBookSavingIncluded, getBookSavingAmount);
  const netValues = incomeValues.map((value, index) => value + expenseValues[index]);
  const rows = [
    renderBookYearReviewRow('수입', incomeValues, { kind: 'income', className: 'is-major' }),
    renderBookYearReviewRow('지출', expenseValues, { kind: 'expense', className: 'is-major' }),
    renderBookYearReviewRow('저축액', savingValues, { kind: 'saving', className: 'is-major' }),
    renderBookYearReviewRow('순흐름', netValues, { kind: 'net', className: 'is-major is-net' }),
  ];

  const savingMap = getBookCategoryMap('saving');
  const savingItems = items.filter(item => getBookType(item) === 'saving');
  rows.push('<tr class="book-year-section"><th colspan="15">저축·이체 목적</th></tr>');
  for (const category of getBookCategories('saving')) {
    const categoryItems = savingItems.filter(item => (savingMap[item.cat] ? item.cat : 'other') === category.id);
    const values = getBookYearReviewValues(categoryItems, () => true);
    rows.push(renderBookYearReviewRow(category.label, values, { kind: 'saving', icon: category.icon, className: 'is-category' }));
    if (!_bookYearReviewShowSubcats) continue;
    const subcategories = [...new Set(categoryItems.map(item => getBookSubcategoryLabel(item) || '미분류'))]
      .filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko'));
    for (const subcategory of subcategories) {
      const subValues = getBookYearReviewValues(categoryItems, item => (getBookSubcategoryLabel(item) || '미분류') === subcategory);
      rows.push(renderBookYearReviewRow(subcategory, subValues, { kind: 'saving', sub: true }));
    }
  }

  const traitValues = (field, value) => getBookYearReviewValues(items, item =>
    getBookType(item) === 'expense' && getBookSpendingTraits(item)[field] === value, getBookNetExpenseAmount).map(amount => -amount);
  rows.push('<tr class="book-year-section"><th colspan="15">지출 성격</th></tr>');
  rows.push(renderBookYearReviewRow('고정비', traitValues('costType', 'fixed'), { kind: 'expense', className: 'is-trait' }));
  rows.push(renderBookYearReviewRow('변동비', traitValues('costType', 'variable'), { kind: 'expense', className: 'is-trait' }));
  rows.push(renderBookYearReviewRow('필수', traitValues('needType', 'essential'), { kind: 'expense', className: 'is-trait' }));
  rows.push(renderBookYearReviewRow('선택', traitValues('needType', 'optional'), { kind: 'expense', className: 'is-trait' }));

  const subscriptionValues = getBookYearReviewValues(items,
    item => getBookType(item) === 'expense' && !!item.subscription,
    getBookNetExpenseAmount).map(amount => -amount);
  rows.push('<tr class="book-year-section"><th colspan="15">구독·반복</th></tr>');
  rows.push(renderBookYearReviewRow('구독·멤버십', subscriptionValues, { kind: 'expense', className: 'is-trait' }));

  const paymentKindValues = kind => getBookYearReviewValues(items, item =>
    getBookType(item) === 'expense' && !!item.payment && inferBookPaymentKind(item.payment) === kind,
    getBookNetExpenseAmount).map(amount => -amount);
  rows.push('<tr class="book-year-section"><th colspan="15">결제 수단 유형</th></tr>');
  rows.push(renderBookYearReviewRow('신용카드', paymentKindValues('credit'), { kind: 'expense', className: 'is-trait' }));
  rows.push(renderBookYearReviewRow('체크카드', paymentKindValues('debit'), { kind: 'expense', className: 'is-trait' }));
  rows.push(renderBookYearReviewRow('현금', paymentKindValues('cash'), { kind: 'expense', className: 'is-trait' }));
  rows.push(renderBookYearReviewRow('계좌이체', paymentKindValues('transfer'), { kind: 'expense', className: 'is-trait' }));

  const allocatedExpenseItems = items.filter(item => getBookType(item) === 'expense').flatMap(item =>
    getBookCategoryAllocations(item).map(allocation => ({
      ...item,
      amount: allocation.amount,
      cat: allocation.cat,
      subcat: allocation.subcat,
      advanceAmount: 0,
      settledAmount: 0,
    })));
  rows.push('<tr class="book-year-section"><th colspan="15">지출 카테고리</th></tr>');
  for (const category of getBookCategories('expense')) {
    const categoryItems = allocatedExpenseItems.filter(item => expenseCategoryId(item) === category.id);
    const values = getBookYearReviewValues(categoryItems, () => true, getBookNetExpenseAmount).map(value => -value);
    rows.push(renderBookYearReviewRow(category.label, values, { kind: 'expense', icon: category.icon, className: 'is-category' }));
    if (!_bookYearReviewShowSubcats) continue;
    const subcategories = [...new Set(categoryItems.map(item => getBookSubcategoryLabel(item) || '미분류'))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'ko'));
    for (const subcategory of subcategories) {
      const subValues = getBookYearReviewValues(categoryItems, item => (getBookSubcategoryLabel(item) || '미분류') === subcategory, getBookNetExpenseAmount).map(value => -value);
      rows.push(renderBookYearReviewRow(subcategory, subValues, { kind: 'expense', sub: true }));
    }
  }
  return { rows: rows.join(''), count: items.length };
}

function renderBookYearReviewPage(container = $('#pgInc')) {
  if (!container) return;
  const report = buildBookYearReviewRows(_bookYearReviewYear);
  container.innerHTML = `
    <section class="book-year-page page-enter" aria-label="연간 가계부 결산">
      <div class="book-year-page-header">
        <button type="button" class="btn-sm book-year-back" data-action="close-book-year-review">← 가계부로</button>
        <div><h2>연간 가계부 결산</h2><p>1월부터 12월까지 월별 금액과 합계·평균을 한 화면에서 비교해요.</p></div>
      </div>
      <div class="card book-year-page-card">
        <div class="book-year-toolbar">
          <div class="book-year-nav" role="navigation" aria-label="결산 연도 선택">
            <button class="btn-icon" data-action="change-book-review-year" data-delta="-1" aria-label="이전 연도">◀</button>
            <strong>${_bookYearReviewYear}년</strong>
            <button class="btn-icon" data-action="change-book-review-year" data-delta="1" aria-label="다음 연도">▶</button>
          </div>
          <button class="btn-sm ${_bookYearReviewShowSubcats ? 'active' : ''}" data-action="toggle-book-review-subcats"
            aria-pressed="${_bookYearReviewShowSubcats}">${_bookYearReviewShowSubcats ? '✓ ' : ''}소분류 포함</button>
        </div>
        <div class="book-year-note">월평균은 기록 유무와 관계없이 연간 합계를 12개월로 나눈 금액입니다. · ${report.count}건</div>
        <div class="book-year-table-wrap">
          <table class="book-year-table">
            <thead><tr><th scope="col">구분</th>${Array.from({ length: 12 }, (_, index) => `<th scope="col">${index + 1}월</th>`).join('')}<th scope="col" class="is-summary">합계</th><th scope="col" class="is-summary">평균</th></tr></thead>
            <tbody>${report.rows}</tbody>
          </table>
        </div>
      </div>
    </section>`;
  container.onclick = e => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'close-book-year-review') {
      _bookYearReviewOpen = false;
      renderIncome();
    } else if (target.dataset.action === 'change-book-review-year') {
      _bookYearReviewYear += Number(target.dataset.delta) || 0;
      renderBookYearReviewPage(container);
    } else if (target.dataset.action === 'toggle-book-review-subcats') {
      _bookYearReviewShowSubcats = !_bookYearReviewShowSubcats;
      renderBookYearReviewPage(container);
    }
  };
}

function openBookCategoryManager(type = ['income', 'saving'].includes(UIState.bookFilter) ? UIState.bookFilter : 'expense') {
  _bookCatManagerType = normalizeBookType(type, 'expense');
  renderBookCategoryManager();
}

function renderInlineBookSubcategoryItem(label = '', original = label, originCatId = '') {
  return `<div class="book-inline-subcat-item" data-original-label="${escAttr(original)}" data-origin-cat-id="${escAttr(originCatId)}">
    <input class="book-inline-subcat-name" type="text" value="${escAttr(label)}" maxlength="40"
      aria-label="${escAttr(label || '새 소분류')} 이름">
    <button type="button" class="book-inline-subcat-delete" data-action="delete-inline-book-subcat"
      aria-label="${escAttr(label || '새 소분류')} 삭제">✕</button>
  </div>`;
}

function renderBookCategoryManager() {
  _modalCleanup.removeAll();
  const type = normalizeBookType(_bookCatManagerType, 'expense');
  const meta = getBookTypeMeta(type);
  const cats = getBookCategories(type);
  const container = $('#modalMain');
  const wasActive = container.classList.contains('active');

  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-large">
      <div class="modal-header">
        <h3>가계부 카테고리 관리</h3>
        <button class="modal-close" data-action="close-modal" data-modal="modalMain" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="book-type-toggle book-cat-type-toggle" role="radiogroup" aria-label="카테고리 유형">
          ${['expense', 'income', 'saving'].map(t => `
            <button type="button" class="book-type-option ${type === t ? 'active' : ''}"
              data-action="switch-book-cat-type" data-type="${t}" role="radio"
              aria-checked="${type === t ? 'true' : 'false'}">${escHtml(getBookTypeMeta(t).label)}</button>
          `).join('')}
        </div>

        <div class="book-cat-manager-head">
          <div>
            <div class="book-cat-manager-title">${escHtml(meta.label)} 대분류</div>
            <div class="book-cat-manager-hint">여러 항목을 수정한 뒤 아래 변경사항 저장을 한 번만 누르면 됩니다. 카드는 드래그로 정렬할 수 있습니다.</div>
          </div>
          <button class="btn-sm" data-action="restore-default-book-cats" data-type="${type}">기본 복원</button>
        </div>

        <div class="book-cat-list" role="list">
          ${cats.map(c => {
            const isOther = c.id === 'other';
            const subcats = getBookSubcategorySuggestions(type, c.id);
            return `
              <div class="book-cat-row" role="listitem" data-cat-id="${escAttr(c.id)}">
                <div class="book-cat-main">
                  <input class="book-cat-inline-icon" type="text" value="${escAttr(c.icon)}" maxlength="12"
                    aria-label="${escAttr(c.label)} 아이콘">
                  <div class="book-cat-text">
                    <input class="book-cat-inline-label" type="text" value="${escAttr(c.label)}" maxlength="30"
                      aria-label="${escAttr(c.label)} 대분류 이름">
                    <div class="book-cat-subline">
                      <div class="book-cat-sub-preview ${subcats.length ? '' : 'is-empty'}">
                        ${subcats.length
                          ? subcats.map(label => `<span class="book-cat-sub-chip" title="${escAttr(label)}">${escHtml(label)}</span>`).join('')
                          : '소분류 없음'}
                      </div>
                      <button class="book-subcat-pencil" data-action="manage-book-subcats" data-type="${type}" data-cat-id="${escAttr(c.id)}"
                        aria-label="${escAttr(c.label)} 소분류 추가 및 수정" aria-expanded="false" title="소분류 추가·수정">✎</button>
                    </div>
                    <div class="book-inline-subcat-editor" data-cat-id="${escAttr(c.id)}" hidden>
                      <div class="book-inline-subcat-list" role="list" aria-label="${escAttr(c.label)} 소분류 목록">
                        ${subcats.map(label => renderInlineBookSubcategoryItem(label, label, c.id)).join('')}
                      </div>
                      <div class="book-inline-subcat-add">
                        <input class="book-inline-subcat-new" type="text" placeholder="새 소분류" maxlength="40"
                          aria-label="${escAttr(c.label)} 새 소분류 이름">
                        <button type="button" data-action="add-inline-book-subcat" aria-label="${escAttr(c.label)} 소분류 추가">＋ 추가</button>
                      </div>
                      <div class="book-inline-subcat-help">이름을 수정하거나 타원을 끌어 순서를 바꾸고, 다른 대분류 칸으로 옮길 수 있어요.</div>
                    </div>
                  </div>
                </div>
                <div class="book-cat-actions">
                  <button class="btn-icon btn-danger" data-action="delete-book-cat" data-type="${type}" data-cat-id="${escAttr(c.id)}" aria-label="${escAttr(c.label)} 카테고리 삭제" ${isOther ? 'disabled' : ''}>✕</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="book-cat-add">
          <div class="book-cat-add-title">새 대분류</div>
          <div class="book-cat-add-row">
            <input type="text" id="bookCatNewIcon" value="🏷️" maxlength="12" aria-label="새 카테고리 아이콘">
            <input type="text" id="bookCatNewLabel" placeholder="대분류 이름" maxlength="30" aria-label="새 대분류 이름">
            <button class="btn-p" data-action="add-book-cat" data-type="${type}">추가</button>
          </div>
        </div>
        <div class="modal-actions book-category-save-footer">
          <button class="btn-p" data-action="save-all-book-cats" data-type="${type}">변경사항 저장</button>
        </div>
      </div>
    </div>
  `;

  if (!wasActive) openModal('modalMain');
  else {
    container.removeAttribute('aria-hidden');
    const backdrop = container.querySelector('.modal-backdrop');
    if (backdrop) backdrop.onclick = () => closeModal('modalMain');
  }
  _setupModalMainDelegation(container);
  _setupBookCategoryManagerDelegation(container);
  _setupBookCategorySorting(container, type);
  _setupInlineBookSubcategorySorting(container);
}

function _setupBookCategoryManagerDelegation(container) {
  const clickHandler = (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'switch-book-cat-type') {
      if (!doSaveAllBookCategories(_bookCatManagerType, { silent: true, render: false })) return;
      _bookCatManagerType = normalizeBookType(target.dataset.type, 'expense');
      renderBookCategoryManager();
    } else if (action === 'add-book-cat') {
      doAddBookCategory(target.dataset.type);
    } else if (action === 'save-all-book-cats') {
      doSaveAllBookCategories(target.dataset.type);
    } else if (action === 'edit-book-cat') {
      openEditBookCategory(target.dataset.type, target.dataset.catId);
    } else if (action === 'manage-book-subcats') {
      toggleInlineBookSubcategoryEditor(target);
    } else if (action === 'add-inline-book-subcat') {
      addInlineBookSubcategory(target.closest('.book-cat-row'));
    } else if (action === 'delete-inline-book-subcat') {
      target.closest('.book-inline-subcat-item')?.remove();
    } else if (action === 'delete-book-cat') {
      doDeleteBookCategory(target.dataset.type, target.dataset.catId);
    } else if (action === 'restore-default-book-cats') {
      doRestoreDefaultBookCategories(target.dataset.type);
    }
  };
  const keyHandler = (e) => {
    if (e.key !== 'Enter') return;
    if (e.target?.id === 'bookCatNewIcon' || e.target?.id === 'bookCatNewLabel') {
      e.preventDefault();
      doAddBookCategory(_bookCatManagerType);
    } else if (e.target?.classList.contains('book-inline-subcat-new')) {
      e.preventDefault();
      addInlineBookSubcategory(e.target.closest('.book-cat-row'));
    }
  };
  _modalCleanup.add(container, 'click', clickHandler);
  _modalCleanup.add(container, 'keydown', keyHandler);
}

function toggleInlineBookSubcategoryEditor(button) {
  const container = button?.closest('#modalMain');
  if (!container) return;
  const opening = !container.classList.contains('is-subcat-editing-all');
  container.classList.toggle('is-subcat-editing-all', opening);
  $$('.book-cat-row', container).forEach(row => {
    const editor = $('.book-inline-subcat-editor', row);
    const preview = $('.book-cat-sub-preview', row);
    const pencil = $('.book-subcat-pencil', row);
    if (!editor || !preview || !pencil) return;
    editor.hidden = !opening;
    preview.hidden = opening;
    row.classList.toggle('is-subcat-editing', opening);
    pencil.classList.toggle('active', opening);
    pencil.textContent = opening ? '✓' : '✎';
    pencil.setAttribute('aria-expanded', opening ? 'true' : 'false');
    pencil.title = opening ? '소분류 편집 닫기' : '소분류 추가·수정';
  });
  if (opening) $('.book-inline-subcat-name', button.closest('.book-cat-row'))?.focus({ preventScroll: true });
}

function addInlineBookSubcategory(row) {
  if (!row) return;
  const input = $('.book-inline-subcat-new', row);
  const list = $('.book-inline-subcat-list', row);
  const label = stripHtml(input?.value || '', 40);
  const labels = $$('.book-inline-subcat-name', list).map(field => stripHtml(field.value, 40));
  if (!label) { showToast('소분류 이름을 입력하세요', 'error'); input?.focus(); return; }
  if (labels.some(value => value.toLowerCase() === label.toLowerCase())) {
    showToast('이미 같은 소분류가 있습니다', 'error');
    input?.focus();
    return;
  }
  if (labels.length >= 30) { showToast('소분류는 최대 30개까지 추가할 수 있습니다', 'error'); return; }
  list.insertAdjacentHTML('beforeend', renderInlineBookSubcategoryItem(label, ''));
  if (input) { input.value = ''; input.focus(); }
}

function _setupInlineBookSubcategorySorting(container) {
  const lists = $$('.book-inline-subcat-list', container);
  let candidate = null;
  let active = null;
  let activeList = null;
  let pointerId = null;
  let startX = 0;
  let startY = 0;

  const finish = e => {
    if (pointerId != null && e?.pointerId != null && e.pointerId !== pointerId) return;
    active?.classList.remove('is-dragging');
    lists.forEach(list => list.classList.remove('is-sorting', 'is-drop-target'));
    document.body.classList.remove('book-sort-active');
    candidate = null;
    active = null;
    activeList = null;
    pointerId = null;
  };
  const pointerDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('button')) return;
    const item = e.target.closest('.book-inline-subcat-item');
    const list = item?.closest('.book-inline-subcat-list');
    if (!item || !list || !container.contains(list)) return;
    candidate = item;
    activeList = list;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
  };
  const pointerMove = e => {
    if (!candidate || e.pointerId !== pointerId) return;
    if (!active) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < 7) return;
      active = candidate;
      active.classList.add('is-dragging');
      document.body.classList.add('book-sort-active');
    }
    e.preventDefault();
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const hoveredList = hit?.closest('.book-inline-subcat-list');
    if (hoveredList && container.contains(hoveredList)) activeList = hoveredList;
    lists.forEach(list => list.classList.toggle('is-drop-target', list === activeList));
    activeList.classList.add('is-sorting');
    const siblings = $$('.book-inline-subcat-item', activeList).filter(item => item !== active);
    const before = siblings.find(item => {
      const rect = item.getBoundingClientRect();
      if (e.clientY < rect.top) return true;
      if (e.clientY > rect.bottom) return false;
      return e.clientX < rect.left + rect.width / 2;
    });
    if (before) activeList.insertBefore(active, before);
    else activeList.appendChild(active);
  };
  lists.forEach(list => _modalCleanup.add(list, 'pointerdown', pointerDown, { capture: true }));
  _modalCleanup.add(document, 'pointermove', pointerMove, { passive: false });
  _modalCleanup.add(document, 'pointerup', finish);
  _modalCleanup.add(document, 'pointercancel', finish);
}

function setBookSearchScope(scope) {
  UIState.bookSearchScope = scope === 'all' ? 'all' : 'month';
  renderIncome();
}

function _setupPointerSortable(list, rowSelector, onCommit) {
  if (!list) return;
  let candidateRow = null;
  let activeRow = null;
  let changed = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;

  const commit = (e) => {
    if (pointerId != null && e?.pointerId != null && e.pointerId !== pointerId) return;
    const rows = activeRow ? [...list.querySelectorAll(rowSelector)] : [];
    if (activeRow) activeRow.classList.remove('is-dragging');
    if (activeRow) list.classList.remove('is-sorting');
    if (activeRow) document.body.classList.remove('book-sort-active');
    candidateRow = null;
    activeRow = null;
    pointerId = null;
    if (changed) onCommit(rows);
    changed = false;
  };

  const pointerMove = (e) => {
    if (!candidateRow || e.pointerId !== pointerId) return;
    if (!activeRow) {
      const distance = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (distance < 7) return;
      activeRow = candidateRow;
      activeRow.classList.add('is-dragging');
      list.classList.add('is-sorting');
      document.body.classList.add('book-sort-active');
    }
    e.preventDefault();
    const listRect = list.getBoundingClientRect();
    if (e.clientY < listRect.top + 32) list.scrollTop -= 14;
    else if (e.clientY > listRect.bottom - 32) list.scrollTop += 14;

    if (e.clientY <= listRect.top + 36) {
      if (activeRow !== list.firstElementChild) {
        list.insertBefore(activeRow, list.firstElementChild);
        changed = true;
      }
      return;
    }
    if (e.clientY >= listRect.bottom - 36) {
      if (activeRow !== list.lastElementChild) {
        list.appendChild(activeRow);
        changed = true;
      }
      return;
    }

    const siblings = [...list.querySelectorAll(rowSelector)].filter(item => item !== activeRow);
    const beforeRow = siblings.find(item => {
      const rect = item.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    const currentNext = activeRow.nextElementSibling;
    if (beforeRow) {
      if (beforeRow !== currentNext) {
        list.insertBefore(activeRow, beforeRow);
        changed = true;
      }
    } else if (activeRow !== list.lastElementChild) {
      list.appendChild(activeRow);
      changed = true;
    }
  };

  $$(rowSelector, list).forEach(row => { if (!row.hasAttribute('tabindex')) row.tabIndex = 0; });
  const pointerDown = (e) => {
    const row = e.target.closest(rowSelector);
    if (!row || !list.contains(row)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('button,a,input,select,textarea')) return;
    candidateRow = row;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    changed = false;
  };
  const keyDown = (e) => {
    const row = e.target.closest(rowSelector);
    if (!row || e.target !== row || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    const sibling = e.key === 'ArrowUp' ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling?.matches(rowSelector)) return;
    e.preventDefault();
    if (e.key === 'ArrowUp') list.insertBefore(row, sibling);
    else list.insertBefore(sibling, row);
    onCommit([...list.querySelectorAll(rowSelector)]);
    row.focus();
  };
  _modalCleanup.add(list, 'pointerdown', pointerDown);
  _modalCleanup.add(list, 'keydown', keyDown);
  _modalCleanup.add(document, 'pointermove', pointerMove, { passive: false });
  _modalCleanup.add(document, 'pointerup', commit);
  _modalCleanup.add(document, 'pointercancel', commit);
}

function _setupBookCategorySorting(container, type) {
  const cleanType = normalizeBookType(type, 'expense');
  const list = $('.book-cat-list', container);
  _setupPointerSortable(list, '.book-cat-row', rows => {
    const ids = rows.map(row => row.dataset.catId).filter(Boolean);
    const prefs = getBookCategoryPrefs();
    prefs[cleanType].order = ids;
    saveBookCategoryPrefs(prefs);
    renderIncome();
  });
}

function _setupBookSubcategorySorting(container, type, catId) {
  const list = $('.book-subcat-list', container);
  _setupPointerSortable(list, '.book-subcat-row', rows => {
    const labels = rows.map(row => stripHtml($('input', row)?.value || '', 40));
    const renamePairs = rows.map((row, index) => ({
      from: stripHtml(row.dataset.subcatValue || '', 40),
      to: labels[index],
    }));
    if (!_validateBookSubcategoryLabels(labels)) {
      openBookSubcategoryManager(type, catId);
      return;
    }
    const migrated = _saveBookSubcategoryList(type, catId, labels, renamePairs);
    if (migrated) renderIncome();
    rows.forEach((row, index) => {
      row.dataset.subcatValue = labels[index];
      const input = $('input', row);
      if (input) input.id = `bookSubcatName-${index}`;
      $$('[data-index]', row).forEach(btn => { btn.dataset.index = String(index); });
    });
  });
}

function openBookSubcategoryManager(type, catId) {
  _modalCleanup.removeAll();
  const cleanType = normalizeBookType(type, 'expense');
  const cat = findBookCategory(cleanType, catId);
  if (!cat) { showToast('대분류를 찾을 수 없습니다', 'error'); return; }
  const labels = getBookSubcategorySuggestions(cleanType, catId);
  const container = $('#modalMain');

  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-large">
      <div class="modal-header">
        <h3>${escHtml(cat.icon)} ${escHtml(cat.label)} 소분류 관리</h3>
        <button class="modal-close" data-action="close-modal" data-modal="modalMain" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="book-cat-manager-hint book-subcat-intro">
          여러 이름을 수정한 뒤 아래 변경사항 저장을 한 번만 누르면 됩니다. 카드는 드래그로 정렬할 수 있습니다.
        </div>

        <div class="book-cat-list book-subcat-list" role="list">
          ${labels.length ? labels.map((label, index) => `
            <div class="book-cat-row book-subcat-row" role="listitem" data-subcat-value="${escAttr(label)}">
              <input type="text" id="bookSubcatName-${index}" value="${escAttr(label)}" maxlength="40"
                aria-label="${escAttr(label)} 소분류 이름">
              <div class="book-cat-actions">
                <button class="btn-icon btn-danger" data-action="delete-book-subcat" data-type="${cleanType}"
                  data-cat-id="${escAttr(catId)}" data-index="${index}" aria-label="${escAttr(label)} 소분류 삭제">✕</button>
              </div>
            </div>
          `).join('') : '<div class="empty-state">등록된 소분류가 없습니다</div>'}
        </div>

        <div class="book-cat-add">
          <div class="book-cat-add-title">새 소분류</div>
          <div class="book-cat-add-row book-subcat-add-row">
            <input type="text" id="bookSubcatNewLabel" placeholder="예: 배달, 장보기" maxlength="40" aria-label="새 소분류 이름">
            <button class="btn-p" data-action="add-book-subcat" data-type="${cleanType}" data-cat-id="${escAttr(catId)}">추가</button>
          </div>
        </div>
        <div class="modal-actions book-subcat-footer">
          <button class="btn-sm" data-action="restore-book-subcats" data-type="${cleanType}" data-cat-id="${escAttr(catId)}">기본값 복원</button>
          <button class="btn-p" data-action="save-all-book-subcats" data-type="${cleanType}" data-cat-id="${escAttr(catId)}">변경사항 저장</button>
          <button class="btn-s" data-action="back-book-cats" data-type="${cleanType}">대분류 목록으로</button>
        </div>
      </div>
    </div>
  `;

  container.classList.add('active');
  container.removeAttribute('aria-hidden');
  const backdrop = container.querySelector('.modal-backdrop');
  if (backdrop) backdrop.onclick = () => closeModal('modalMain');
  _setupModalMainDelegation(container);
  _setupBookSubcategoryManagerDelegation(container);
  _setupBookSubcategorySorting(container, cleanType, catId);
}

function _migrateBookSubcategoryRenames(type, catId, renamePairs = []) {
  const cleanType = normalizeBookType(type, 'expense');
  const renameMap = new Map();
  for (const pair of renamePairs) {
    const from = stripHtml(pair?.from || '', 40);
    const to = stripHtml(pair?.to || '', 40);
    if (!from || !to || from === to) continue;
    renameMap.set(from.toLowerCase(), to);
  }
  if (!renameMap.size) return 0;

  let migrated = 0;
  for (const item of appState.income) {
    if (getBookType(item) !== cleanType || item.cat !== catId) continue;
    const current = getBookSubcategoryLabel(item);
    const next = renameMap.get(current.toLowerCase());
    if (!next || next === current) continue;
    item.subcat = next;
    migrated += 1;
  }
  if (migrated) EventBus.emit('incomeChanged', { type: 'subcategoryRename', catId, count: migrated });
  return migrated;
}

function _migrateBookSubcategoryMoves(type, moves = []) {
  const cleanType = normalizeBookType(type, 'expense');
  const moveMap = new Map();
  for (const move of moves) {
    const fromCatId = stripHtml(move?.fromCatId || '', 80);
    const toCatId = stripHtml(move?.toCatId || '', 80);
    const from = stripHtml(move?.from || '', 40);
    const to = stripHtml(move?.to || '', 40);
    if (!fromCatId || !toCatId || fromCatId === toCatId || !from || !to) continue;
    moveMap.set(`${fromCatId}\u0000${from.toLowerCase()}`, { toCatId, to });
  }
  if (!moveMap.size) return 0;

  let migrated = 0;
  for (const item of appState.income) {
    if (getBookType(item) !== cleanType) continue;
    const current = getBookSubcategoryLabel(item);
    const move = moveMap.get(`${item.cat}\u0000${current.toLowerCase()}`);
    if (!move) continue;
    item.cat = move.toCatId;
    item.subcat = move.to;
    migrated += 1;
  }
  if (migrated) EventBus.emit('incomeChanged', { type: 'subcategoryMove', count: migrated });
  return migrated;
}

function openBookSubcategoryMoveChoice(moves, onChoice) {
  const container = $('#modalConfirm');
  if (!container) return;
  _modalCleanup.removeForElement(container);
  const names = [...new Set(moves.map(move => move.to).filter(Boolean))];
  const preview = names.slice(0, 3).join(', ') + (names.length > 3 ? ` 외 ${names.length - 3}개` : '');
  container.innerHTML = `<div class="modal-backdrop"></div>
    <div class="modal-box" role="dialog" aria-labelledby="bookSubcatMoveTitle" aria-describedby="bookSubcatMoveMsg">
      <div class="modal-body">
        <h3 id="bookSubcatMoveTitle" class="book-subcat-move-title">기존 가계부 내역도 옮길까요?</h3>
        <p id="bookSubcatMoveMsg" class="book-subcat-move-msg"><strong>${escHtml(preview)}</strong> 소분류가 다른 대분류로 이동했습니다.</p>
        <div class="book-subcat-move-options">
          <button class="book-subcat-move-option is-recommended" data-action="save-book-cat-moves" data-move-existing="true">
            <strong>기존 내역까지 이동</strong><span>전에 작성한 내역의 대분류도 함께 바뀝니다.</span>
          </button>
          <button class="book-subcat-move-option" data-action="save-book-cat-moves" data-move-existing="false">
            <strong>앞으로만 적용</strong><span>기존 내역은 원래 대분류에 그대로 둡니다.</span>
          </button>
        </div>
        <div class="modal-actions"><button class="btn-s" data-action="close-book-cat-moves">취소</button></div>
      </div>
    </div>`;
  openModal('modalConfirm');
  const handler = e => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'close-book-cat-moves') closeModal('modalConfirm');
    else if (target.dataset.action === 'save-book-cat-moves') {
      closeModal('modalConfirm');
      onChoice(target.dataset.moveExisting === 'true');
    }
  };
  _modalCleanup.add(container, 'click', handler);
}

function _saveBookSubcategoryList(type, catId, labels, renamePairs = []) {
  const cleanType = normalizeBookType(type, 'expense');
  const migrated = _migrateBookSubcategoryRenames(cleanType, catId, renamePairs);
  const prefs = getBookCategoryPrefs();
  prefs[cleanType].subcategories[catId] = labels;
  saveBookCategoryPrefs(prefs);
  return migrated;
}

function _readBookSubcategoryDrafts() {
  return $$('.book-subcat-row input', $('#modalMain')).map(input => stripHtml(input.value, 40));
}

function _readBookSubcategoryRenamePairs() {
  return $$('.book-subcat-row', $('#modalMain')).map(row => ({
    from: stripHtml(row.dataset.subcatValue || '', 40),
    to: stripHtml($('input', row)?.value || '', 40),
  }));
}

function _validateBookSubcategoryLabels(labels) {
  if (labels.some(label => !label)) { showToast('비어 있는 소분류 이름이 있습니다', 'error'); return false; }
  const keys = labels.map(label => label.toLowerCase());
  if (new Set(keys).size !== keys.length) { showToast('중복된 소분류 이름이 있습니다', 'error'); return false; }
  return true;
}

function doSaveAllBookSubcategories(type, catId) {
  const labels = _readBookSubcategoryDrafts();
  if (!_validateBookSubcategoryLabels(labels)) return false;
  const migrated = _saveBookSubcategoryList(type, catId, labels, _readBookSubcategoryRenamePairs());
  if (migrated) renderIncome();
  showToast(migrated
    ? `소분류 변경사항과 기존 내역 ${migrated}건이 함께 저장되었습니다`
    : '소분류 변경사항이 저장되었습니다', 'success');
  openBookSubcategoryManager(type, catId);
  return true;
}

function doAddBookSubcategory(type, catId) {
  const label = stripHtml($('#bookSubcatNewLabel')?.value, 40);
  if (!label) { showToast('소분류 이름을 입력하세요', 'error'); return; }
  const labels = _readBookSubcategoryDrafts();
  if (!_validateBookSubcategoryLabels(labels)) return;
  if (labels.some(v => v.toLowerCase() === label.toLowerCase())) {
    showToast('이미 같은 소분류가 있습니다', 'error');
    return;
  }
  if (labels.length >= 30) { showToast('소분류는 최대 30개까지 추가할 수 있습니다', 'error'); return; }
  labels.push(label);
  _saveBookSubcategoryList(type, catId, labels);
  showToast('소분류가 추가되었습니다', 'success');
  openBookSubcategoryManager(type, catId);
}

function doSaveBookSubcategory(type, catId, index) {
  const labels = [...getBookSubcategorySuggestions(type, catId)];
  if (index < 0 || index >= labels.length) return;
  const nextLabel = stripHtml($(`#bookSubcatName-${index}`)?.value, 40);
  if (!nextLabel) { showToast('소분류 이름을 입력하세요', 'error'); return; }
  if (labels.some((v, i) => i !== index && v.toLowerCase() === nextLabel.toLowerCase())) {
    showToast('이미 같은 소분류가 있습니다', 'error');
    return;
  }
  labels[index] = nextLabel;
  const migrated = _saveBookSubcategoryList(type, catId, labels, [{ from: getBookSubcategorySuggestions(type, catId)[index], to: nextLabel }]);
  if (migrated) renderIncome();
  showToast(migrated ? `소분류 이름과 기존 내역 ${migrated}건이 수정되었습니다` : '소분류 이름이 수정되었습니다', 'success');
  openBookSubcategoryManager(type, catId);
}

function doDeleteBookSubcategory(type, catId, index) {
  const labels = _readBookSubcategoryDrafts();
  if (!_validateBookSubcategoryLabels(labels)) return;
  if (index < 0 || index >= labels.length) return;
  labels.splice(index, 1);
  _saveBookSubcategoryList(type, catId, labels);
  showToast('소분류가 삭제되었습니다', 'success');
  openBookSubcategoryManager(type, catId);
}

function doRestoreBookSubcategories(type, catId) {
  const cleanType = normalizeBookType(type, 'expense');
  const prefs = getBookCategoryPrefs();
  delete prefs[cleanType].subcategories[catId];
  saveBookCategoryPrefs(prefs);
  showToast('기본 소분류로 복원되었습니다', 'success');
  openBookSubcategoryManager(cleanType, catId);
}

function _setupBookSubcategoryManagerDelegation(container) {
  const clickHandler = (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const type = target.dataset.type;
    const catId = target.dataset.catId;
    const index = Number(target.dataset.index);
    if (action === 'add-book-subcat') doAddBookSubcategory(type, catId);
    else if (action === 'save-all-book-subcats') doSaveAllBookSubcategories(type, catId);
    else if (action === 'save-book-subcat') doSaveBookSubcategory(type, catId, index);
    else if (action === 'delete-book-subcat') doDeleteBookSubcategory(type, catId, index);
    else if (action === 'restore-book-subcats') doRestoreBookSubcategories(type, catId);
    else if (action === 'back-book-cats') {
      _bookCatManagerType = normalizeBookType(type, 'expense');
      renderBookCategoryManager();
    }
  };
  const keyHandler = (e) => {
    if (e.key === 'Enter' && e.target?.id === 'bookSubcatNewLabel') {
      e.preventDefault();
      const addBtn = e.target.closest('.modal-box')?.querySelector('[data-action="add-book-subcat"]');
      if (addBtn) doAddBookSubcategory(addBtn.dataset.type, addBtn.dataset.catId);
    }
  };
  _modalCleanup.add(container, 'click', clickHandler);
  _modalCleanup.add(container, 'keydown', keyHandler);
}

function countBookCategoryUsage(type, catId) {
  return appState.income.filter(i => getBookType(i) === type && i.cat === catId).length;
}

function findBookCategory(type, catId) {
  return getBookCategories(type).find(c => c.id === catId) || null;
}

function hasBookCategoryLabel(type, label, exceptId = '') {
  const clean = stripHtml(label, 30).toLowerCase();
  return getBookCategories(type).some(c => c.id !== exceptId && c.label.toLowerCase() === clean);
}

function doSaveAllBookCategories(type, options = {}) {
  const cleanType = normalizeBookType(type, 'expense');
  const rows = $$('.book-cat-list > .book-cat-row', $('#modalMain'));
  const drafts = rows.map(row => {
    const subcategoryItems = $$('.book-inline-subcat-item', row);
    return {
      id: row.dataset.catId,
      label: stripHtml($('.book-cat-inline-label', row)?.value || '', 30),
      icon: stripHtml($('.book-cat-inline-icon', row)?.value || '', 12) || '🏷️',
      subcategories: subcategoryItems.map(item => ({
        from: stripHtml(item.dataset.originalLabel || '', 40),
        to: stripHtml($('.book-inline-subcat-name', item)?.value || '', 40),
        originCatId: stripHtml(item.dataset.originCatId || '', 80),
      })),
    };
  });
  if (drafts.some(draft => !draft.label)) {
    showToast('비어 있는 대분류 이름이 있습니다', 'error');
    return false;
  }
  const labelKeys = drafts.map(draft => draft.label.toLowerCase());
  if (new Set(labelKeys).size !== labelKeys.length) {
    showToast('중복된 대분류 이름이 있습니다', 'error');
    return false;
  }
  for (const draft of drafts) {
    const labels = draft.subcategories.map(pair => pair.to);
    if (labels.some(label => !label)) {
      showToast(`"${draft.label}"에 비어 있는 소분류 이름이 있습니다`, 'error');
      return false;
    }
    const keys = labels.map(label => label.toLowerCase());
    if (new Set(keys).size !== keys.length) {
      showToast(`"${draft.label}"에 중복된 소분류 이름이 있습니다`, 'error');
      return false;
    }
  }

  const moves = drafts.flatMap(draft => draft.subcategories
    .filter(pair => pair.originCatId && pair.originCatId !== draft.id && pair.from && pair.to)
    .map(pair => ({ fromCatId: pair.originCatId, toCatId: draft.id, from: pair.from, to: pair.to })));
  if (moves.length && typeof options.moveExisting !== 'boolean') {
    openBookSubcategoryMoveChoice(moves, moveExisting => {
      doSaveAllBookCategories(cleanType, { ...options, moveExisting });
    });
    return false;
  }

  const prefs = getBookCategoryPrefs();
  const defaultMap = getDefaultBookCategoryMap(cleanType);
  let migrated = 0;
  for (const draft of drafts) {
    if (defaultMap[draft.id]) {
      const original = defaultMap[draft.id];
      if (draft.label === original.label && draft.icon === original.icon) delete prefs[cleanType].overrides[draft.id];
      else prefs[cleanType].overrides[draft.id] = { label: draft.label, icon: draft.icon };
    } else {
      const custom = prefs[cleanType].custom.find(c => c.id === draft.id);
      if (custom) { custom.label = draft.label; custom.icon = draft.icon; }
    }
    prefs[cleanType].subcategories[draft.id] = draft.subcategories.map(pair => pair.to);
    migrated += _migrateBookSubcategoryRenames(cleanType, draft.id,
      draft.subcategories.filter(pair => !pair.originCatId || pair.originCatId === draft.id));
  }
  if (options.moveExisting) migrated += _migrateBookSubcategoryMoves(cleanType, moves);
  prefs[cleanType].order = drafts.map(draft => draft.id);
  saveBookCategoryPrefs(prefs);
  if (!options.silent) showToast(migrated
    ? `카테고리 변경사항과 기존 내역 ${migrated}건이 함께 저장되었습니다`
    : '카테고리 변경사항이 저장되었습니다', 'success');
  if (options.render !== false) {
    renderBookCategoryManager();
    renderIncome();
  }
  return true;
}

function doAddBookCategory(type) {
  const cleanType = normalizeBookType(type, 'expense');
  if (!doSaveAllBookCategories(cleanType, { silent: true, render: false })) return;
  const prefs = getBookCategoryPrefs();
  const label = stripHtml($('#bookCatNewLabel')?.value, 30);
  const icon = stripHtml($('#bookCatNewIcon')?.value, 12) || '🏷️';
  if (!label) { showToast('카테고리 이름을 입력하세요', 'error'); return; }
  if (hasBookCategoryLabel(cleanType, label)) { showToast('이미 같은 이름의 카테고리가 있습니다', 'error'); return; }
  if (prefs[cleanType].custom.length >= BOOK_CAT_MAX_PER_TYPE) {
    showToast(`사용자 카테고리는 최대 ${BOOK_CAT_MAX_PER_TYPE}개까지`, 'error');
    return;
  }

  prefs[cleanType].custom.push({
    id: `${cleanType}_cat_${uid().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 18)}`,
    label,
    icon,
  });
  saveBookCategoryPrefs(prefs);
  showToast('카테고리 추가됨', 'success');
  renderBookCategoryManager();
  renderIncome();
}

function openEditBookCategory(type, catId) {
  const cleanType = normalizeBookType(type, 'expense');
  const cat = findBookCategory(cleanType, catId);
  if (!cat) return;

  const container = $('#modalSub');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <div class="modal-header">
        <h3>카테고리 편집</h3>
        <button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group book-cat-icon-field">
            <label for="bookCatEditIcon">아이콘</label>
            <input type="text" id="bookCatEditIcon" value="${escAttr(cat.icon)}" maxlength="12">
          </div>
          <div class="form-group">
            <label for="bookCatEditLabel">이름</label>
            <input type="text" id="bookCatEditLabel" value="${escAttr(cat.label)}" maxlength="30">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-s" data-action="close-sub-modal">취소</button>
          <button class="btn-p" data-action="save-book-cat-edit" data-type="${cleanType}" data-cat-id="${escAttr(catId)}">저장</button>
        </div>
      </div>
    </div>
  `;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'save-book-cat-edit') {
      doSaveBookCategoryEdit(target.dataset.type, target.dataset.catId);
    }
  });
}

function doSaveBookCategoryEdit(type, catId) {
  const cleanType = normalizeBookType(type, 'expense');
  const label = stripHtml($('#bookCatEditLabel')?.value, 30);
  const icon = stripHtml($('#bookCatEditIcon')?.value, 12) || '🏷️';
  if (!label) { showToast('카테고리 이름을 입력하세요', 'error'); return; }
  if (hasBookCategoryLabel(cleanType, label, catId)) { showToast('이미 같은 이름의 카테고리가 있습니다', 'error'); return; }

  const prefs = getBookCategoryPrefs();
  const defaultMap = getDefaultBookCategoryMap(cleanType);
  if (defaultMap[catId]) {
    prefs[cleanType].overrides[catId] = { label, icon };
  } else {
    const idx = prefs[cleanType].custom.findIndex(c => c.id === catId);
    if (idx < 0) return;
    prefs[cleanType].custom[idx] = { ...prefs[cleanType].custom[idx], label, icon };
  }
  saveBookCategoryPrefs(prefs);
  closeModal('modalSub');
  showToast('카테고리 수정됨', 'success');
  renderBookCategoryManager();
  renderIncome();
}

function doDeleteBookCategory(type, catId) {
  const cleanType = normalizeBookType(type, 'expense');
  if (!doSaveAllBookCategories(cleanType, { silent: true, render: false })) return;
  const cat = findBookCategory(cleanType, catId);
  if (!cat) return;
  if (catId === 'other') { showToast('기타 카테고리는 삭제할 수 없습니다', 'error'); return; }
  if (getBookCategories(cleanType).length <= 1) { showToast('카테고리는 최소 1개가 필요합니다', 'error'); return; }
  const usage = countBookCategoryUsage(cleanType, catId);
  const msg = usage > 0
    ? `"${cat.label}" 카테고리를 삭제할까요?\n이 카테고리를 쓰던 ${usage}건은 기타로 이동합니다.`
    : `"${cat.label}" 카테고리를 삭제할까요?`;
  openConfirmModal(msg, () => {
    const prefs = getBookCategoryPrefs();
    const defaultMap = getDefaultBookCategoryMap(cleanType);
    if (defaultMap[catId]) {
      if (!prefs[cleanType].hidden.includes(catId)) prefs[cleanType].hidden.push(catId);
      delete prefs[cleanType].overrides[catId];
    } else {
      prefs[cleanType].custom = prefs[cleanType].custom.filter(c => c.id !== catId);
    }
    for (const item of appState.income) {
      if (getBookType(item) === cleanType && item.cat === catId) item.cat = 'other';
    }
    appState.bookCategories = normalizeBookCategoryPrefs(prefs);
    saveData();
    EventBus.emit('bookCategoriesChanged');
    showToast('카테고리 삭제됨', 'success');
    renderBookCategoryManager();
    renderIncome();
  });
}

function doRestoreDefaultBookCategories(type) {
  const cleanType = normalizeBookType(type, 'expense');
  openConfirmModal(`${getBookTypeMeta(cleanType).label} 기본 카테고리를 복원할까요?\n사용자 추가 카테고리는 유지됩니다.`, () => {
    const prefs = getBookCategoryPrefs();
    prefs[cleanType].hidden = [];
    prefs[cleanType].overrides = {};
    prefs[cleanType].order = [];
    saveBookCategoryPrefs(prefs);
    showToast('기본 카테고리 복원됨', 'success');
    renderBookCategoryManager();
    renderIncome();
  });
}

function renderIncomeItems(items) {
  if (items.length === 0) return '<div class="empty-state">조건에 맞는 가계부 내역이 없습니다</div>';
  const sorted = [...items].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `
    <div class="income-list" role="list">
      ${sorted.map(i => {
        const type = getBookType(i);
        const meta = getBookTypeMeta(type);
        const cat = getBookCategory(i);
        const subcat = getBookSubcategoryLabel(i);
        const amountPrefix = type === 'income' ? '+' : type === 'saving' ? '↔ ' : '-';
        const traits = getBookSpendingTraits(i);
        const costMeta = getBookTraitMeta('costType', traits.costType);
        const needMeta = getBookTraitMeta('needType', traits.needType);
        const repeatCycle = getBookRepeatCycle(i);
        const repeatLabel = repeatCycle === 'monthly' ? '매월' : repeatCycle === 'yearly' ? '매년' : '';
        const lineItems = getBookLineItems(i);
        const splitTitle = lineItems.length ? (lineItems.length === 1 ? lineItems[0].name : `${lineItems[0].name} 외 ${lineItems.length - 1}개`) : '';
        const liveTransfer = type === 'saving' && i.fromAccount && i.toAccount
          ? `${getBookAccountLabel(i.fromAccount)} → ${getBookAccountLabel(i.toAccount)}` : '';
        const displaySource = liveTransfer || String(i.source || '').trim();
        const itemTitle = String(i.item || '').trim() || splitTitle || displaySource || cat.label;
        const sourceDetail = (i.item || lineItems.length) && displaySource ? ` · ${escHtml(displaySource)}` : '';
        const advance = getBookAdvanceInfo(i);
        const discount = getBookDiscountInfo(i);
        const advanceLabel = advance.status === 'settled' ? '정산 완료'
          : advance.status === 'partial' ? `일부 정산 · 받을 돈 ${fmtKRW(advance.outstanding)}`
          : advance.status === 'pending' ? `정산 대기 ${fmtKRW(advance.outstanding)}` : '';
        return `
          <div class="income-item book-item-${type}" role="listitem">
            <div class="income-item-main">
              <span class="income-cat-icon ${type}" style="--book-cat-color:${escAttr(getBookCategoryColor(type, i.cat))}" aria-hidden="true">${cat.icon}</span>
              <div class="income-item-text">
                <div class="income-item-source">${escHtml(itemTitle)}</div>
                <div class="income-item-date">
                  <span class="book-type-badge ${type}">${escHtml(meta.label)}</span>
                  ${escHtml(cat.label)}${subcat ? ` › ${escHtml(subcat)}` : ''}${sourceDetail} · ${escHtml(fmtDate(i.date))}${i.payment ? ` · 💳 ${escHtml(i.payment)}(${escHtml(BOOK_PAYMENT_KINDS[inferBookPaymentKind(i.payment)]?.short || '기타')})` : ''}${repeatLabel ? ` · ${repeatLabel} 반복` : ''}${i.subscription ? ' · 구독' : ''}
                </div>
                ${lineItems.length ? `<div class="book-line-item-list" aria-label="나눈 품목 ${lineItems.length}개">
                  ${lineItems.map(line => {
                    const lineCat = getBookCategoryMap('expense')[line.cat] || getBookCategoryMap('expense').other;
                    const qty = Math.max(1, Math.floor(safeNum(line.qty) || 1));
                    const unitPrice = Math.max(0, safeNum(line.unitPrice) || (safeNum(line.amount) / qty));
                    return `<div><span>${escHtml(line.name)}${qty > 1 ? ` <em>× ${qty}</em>` : ''}</span><small>${escHtml(lineCat.label)}${line.subcat ? ` › ${escHtml(line.subcat)}` : ''}${qty > 1 ? ` · 개당 ${escHtml(fmtKRW(unitPrice))}` : ''}</small><strong>${escHtml(fmtKRW(line.amount))}</strong></div>`;
                  }).join('')}
                </div>` : ''}
                ${i.memo ? `<div class="income-item-memo">${escHtml(i.memo)}</div>` : ''}
                ${(i.relatedUrl || i.receiptImage) ? `<div class="book-item-attachments">
                  ${i.relatedUrl ? `<a class="book-attachment-link" href="${escAttr(i.relatedUrl)}" target="_blank" rel="noopener noreferrer">🔗 관련 링크</a>` : ''}
                  ${i.receiptImage ? `<button type="button" class="book-attachment-photo" data-action="open-ledger-receipt" data-id="${escAttr(i.id)}"><img src="${escAttr(i.receiptImage)}" alt="첨부 사진 미리보기"><span>사진 보기</span></button>` : ''}
                </div>` : ''}
                ${type === 'expense' ? `<div class="book-item-traits">
                  <span class="book-trait-badge ${costMeta.cls}">${escHtml(costMeta.label)}</span>
                  <span class="book-trait-badge ${needMeta.cls}">${escHtml(needMeta.label)}</span>
                  ${advanceLabel ? `<span class="book-settlement-badge ${advance.status}">${escHtml(advanceLabel)}</span>` : ''}
                  ${discount.discount > 0 ? `<span class="book-discount-badge">쿠폰·할인 ${escHtml(fmtKRW(discount.discount))}</span>` : ''}
                </div>` : ''}
                ${type === 'saving' ? `<div class="book-item-traits">
                  <span class="book-saving-badge ${isBookSavingIncluded(i) ? 'included' : 'transfer'}">${isBookSavingIncluded(i) ? '저축 반영' : '자산이동 · 저축 제외'}</span>
                </div>` : ''}
              </div>
            </div>
            <div class="income-item-right">
              <span class="income-item-amount-wrap"><span class="income-item-amount ${type}">${amountPrefix}${escHtml(fmtKRW(i.amount))}</span>${discount.original > 0 ? `<small><s>${escHtml(fmtKRW(discount.original))}</s>에서 할인</small>` : ''}${advance.expected > 0 ? `<small>내 지출 ${escHtml(fmtKRW(advance.personalExpense))}</small>` : ''}</span>
              <button class="btn-icon" data-action="copy-income" data-id="${i.id}" aria-label="이 가계부 내역 복사">⧉</button>
              <button class="btn-icon" data-action="edit-income" data-id="${i.id}" aria-label="가계부 내역 수정">✎</button>
              <button class="btn-icon btn-danger" data-action="delete-income" data-id="${i.id}" aria-label="가계부 내역 삭제">✕</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getCategoryChartType(items) {
  if (UIState.bookFilter === 'income') return 'income';
  if (UIState.bookFilter === 'expense') return 'expense';
  if (UIState.bookFilter === 'saving') return 'saving';
  if (items.some(i => getBookType(i) === 'expense')) return 'expense';
  if (items.some(i => getBookType(i) === 'income')) return 'income';
  return 'saving';
}

function getCategoryChartTitle(items) {
  if (!items || items.length === 0) return '카테고리별';
  const type = getCategoryChartType(items);
  return `${getBookTypeMeta(type).label} 카테고리`;
}

function renderIncomeCatLegend(items) {
  const type = getCategoryChartType(items);
  const typeItems = items.filter(i => getBookType(i) === type);
  const byCat = {};
  for (const i of typeItems) {
    if (type === 'expense') addBookCategoryAllocations(byCat, i);
    else byCat[i.cat] = (byCat[i.cat] || 0) + safeNum(i.amount);
  }
  const total = typeItems.reduce((s, i) => s + (type === 'expense' ? getBookNetExpenseAmount(i) : safeNum(i.amount)), 0);
  if (total === 0) return '<div class="empty-state empty-state-compact">표시할 카테고리 데이터가 없습니다</div>';
  const map = getBookCategoryMap(type);
  return `
    <div class="pie-legend" role="list" aria-label="${escAttr(getBookTypeMeta(type).label)} 카테고리 범례">
      ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([catId, val]) => {
        const cat = map[catId] || map.other;
        const pct = ((val / total) * 100).toFixed(1);
        return `
          <div class="legend-item" role="listitem">
            <span class="legend-label"><i class="book-cat-color-dot" style="--book-cat-color:${escAttr(getBookCategoryColor(type, catId))}" aria-hidden="true"></i>${cat.icon} ${escHtml(cat.label)}</span>
            <span class="legend-value">${escHtml(fmtKRW(val))}</span>
            <span class="legend-pct">${pct}%</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderIncomeCharts(items, year, month) {
  renderBookCategoryChart(items);
  destroyChart('incBar');
}

function formatBookCalendarAmount(amount) {
  const value = Math.max(0, safeNum(amount));
  if (value >= 100000000) return `${(value / 100000000).toFixed(value % 100000000 ? 1 : 0)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(value % 10000 ? 1 : 0)}만`;
  return value.toLocaleString('ko-KR');
}

function renderBookExpenseCalendar(items, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const todayKey = today();
  const dailyExpense = {};
  for (const item of items) {
    if (getBookType(item) !== 'expense') continue;
    const day = Number((item.date || '').slice(8, 10));
    if (day >= 1 && day <= daysInMonth) dailyExpense[day] = (dailyExpense[day] || 0) + getBookNetExpenseAmount(item);
  }

  const cells = Array.from({ length: firstWeekday }, () => '<div class="book-calendar-cell is-blank" aria-hidden="true"></div>');
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const amount = dailyExpense[day] || 0;
    const isFuture = dateKey > todayKey;
    const isToday = dateKey === todayKey;
    const status = amount > 0 ? 'spending' : (isFuture ? 'future' : 'no-spend');
    const detail = amount > 0
      ? `<span class="book-calendar-amount">-${escHtml(formatBookCalendarAmount(amount))}</span>`
      : (isFuture ? '<span class="book-calendar-future">·</span>' : '<span class="book-calendar-heart" aria-hidden="true">💙</span>');
    const ariaDetail = amount > 0 ? `지출 ${fmtKRW(amount)}` : (isFuture ? '예정일' : '무지출');
    cells.push(`
      <div class="book-calendar-cell is-${status} ${isToday ? 'is-today' : ''}"
        aria-label="${month}월 ${day}일, ${escAttr(ariaDetail)}">
        <span class="book-calendar-day">${day}</span>
        ${detail}
      </div>
    `);
  }
  while (cells.length % 7) cells.push('<div class="book-calendar-cell is-blank" aria-hidden="true"></div>');

  return `
    <div class="book-calendar" role="grid" aria-label="${year}년 ${month}월 일별 지출 달력">
      <div class="book-calendar-weekdays" role="row">
        ${['일', '월', '화', '수', '목', '금', '토'].map((label, index) => `<span class="${index === 0 ? 'sun' : index === 6 ? 'sat' : ''}" role="columnheader">${label}</span>`).join('')}
      </div>
      <div class="book-calendar-grid">${cells.join('')}</div>
    </div>
  `;
}

function renderBookSettlementSummary(items) {
  const advances = items.map(getBookAdvanceInfo).filter(info => info.expected > 0);
  const outstanding = advances.reduce((sum, info) => sum + info.outstanding, 0);
  const pendingCount = advances.filter(info => info.outstanding > 0).length;
  const settled = advances.reduce((sum, info) => sum + info.settled, 0);
  if (!advances.length) return '';
  return `<div class="book-settlement-summary" aria-label="대납 정산 현황">
    <div><span>아직 받을 돈</span><strong>${escHtml(fmtKRW(outstanding))}</strong><small>${pendingCount}건 정산 대기</small></div>
    <div><span>돌려받은 돈</span><strong>${escHtml(fmtKRW(settled))}</strong><small>수입이 아닌 대납 회수로 계산</small></div>
  </div>`;
}

function renderBookRepeatSummary(items) {
  const activeRepeats = getActiveRecurringItems();
  const repeating = activeRepeats;
  const subscriptions = items.filter(item => getBookType(item) === 'expense' && item.subscription);
  if (!activeRepeats.length && !subscriptions.length) return '';
  const subscriptionAmount = subscriptions.reduce((sum, item) => sum + getBookNetExpenseAmount(item), 0);
  const monthlyCount = repeating.filter(item => getBookRepeatCycle(item) === 'monthly').length;
  const yearlyCount = repeating.filter(item => getBookRepeatCycle(item) === 'yearly').length;
  return `<div class="book-repeat-summary" aria-label="반복 및 구독 현황">
    <span>구독·멤버십 <strong>${subscriptions.length}건 · ${escHtml(fmtKRW(subscriptionAmount))}</strong></span>
    <span>반복 <strong>매월 ${monthlyCount}건 · 매년 ${yearlyCount}건</strong></span>
    ${activeRepeats.length ? `<button type="button" data-action="open-recurring-manager">반복 내역 관리</button>` : ''}
  </div>`;
}

function getRecurringDefinitionKey(item) {
  const lineNames = getBookLineItems(item).map(line => line.name).join('|');
  return [getBookType(item), item.cat || '', getBookSubcategoryLabel(item), item.source || '', item.item || '', item.payment || '', lineNames].join('¦');
}

function getActiveRecurringItems() {
  const latest = new Map();
  for (const item of appState.income || []) {
    if (!getBookRepeatCycle(item)) continue;
    const key = getRecurringDefinitionKey(item);
    const previous = latest.get(key);
    if (!previous || `${item.date}|${item.id}` > `${previous.date}|${previous.id}`) latest.set(key, item);
  }
  return [...latest.values()].sort((a, b) => (a.date || '').localeCompare(b.date || '') || String(a.source || '').localeCompare(String(b.source || ''), 'ko'));
}

function openRecurringManager() {
  const items = getActiveRecurringItems();
  if (!items.length) { showToast('관리할 반복 내역이 없어요', 'info'); return; }
  const container = $('#modalSub');
  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box modal-large">
    <div class="modal-header"><h3>반복 내역 관리</h3><button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button></div>
    <div class="modal-body recurring-manager-modal">
      <p class="recurring-manager-note">이름·금액·기준 날짜·반복 주기를 바꿀 수 있어요. 삭제는 과거 기록을 남기고 앞으로의 반복만 해제합니다.</p>
      <div class="recurring-manager-list">
        ${items.map(item => {
          const type = getBookType(item);
          const cat = getBookCategory(item);
          const name = String(item.item || item.source || cat.label).trim();
          return `<div class="recurring-manager-item" data-id="${escAttr(item.id)}">
            <span class="income-cat-icon ${type}" style="--book-cat-color:${escAttr(getBookCategoryColor(type, item.cat))}" aria-hidden="true">${cat.icon}</span>
            <div class="recurring-manager-name"><label><span>이름</span><input class="recurring-manager-name-input" type="text" value="${escAttr(name)}" maxlength="80"></label><small>${escHtml(getBookTypeMeta(type).label)} · ${escHtml(cat.label)}${item.payment ? ` · ${escHtml(item.payment)}` : ''}</small></div>
            <label><span>기준 날짜</span><input class="recurring-manager-date" type="date" value="${escAttr(item.date)}"></label>
            <label><span>금액</span><input class="recurring-manager-amount" type="number" inputmode="decimal" min="1" value="${escAttr(item.amount)}"></label>
            <label><span>반복</span><select class="recurring-manager-cycle"><option value="monthly" ${getBookRepeatCycle(item) === 'monthly' ? 'selected' : ''}>매월</option><option value="yearly" ${getBookRepeatCycle(item) === 'yearly' ? 'selected' : ''}>매년</option><option value="">반복 안 함</option></select></label>
            <button type="button" class="recurring-manager-remove" data-action="toggle-remove-recurring" aria-label="${escAttr(name)} 반복 삭제">삭제</button>
          </div>`;
        }).join('')}
      </div>
      <div class="modal-actions"><button class="btn-s" data-action="close-sub-modal">취소</button><button class="btn-p" data-action="save-recurring-manager">변경사항 저장</button></div>
    </div></div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'save-recurring-manager') saveRecurringManager();
    else if (action === 'toggle-remove-recurring') {
      const row = target.closest('.recurring-manager-item');
      if (!row) return;
      const removing = !row.classList.contains('is-removing');
      row.classList.toggle('is-removing', removing);
      row.dataset.remove = removing ? 'true' : '';
      $$('input, select', row).forEach(field => { field.disabled = removing; });
      target.textContent = removing ? '되돌리기' : '삭제';
      target.classList.toggle('is-undo', removing);
    }
  });
}

function saveRecurringManager() {
  const rows = $$('.recurring-manager-item', $('#modalSub'));
  for (const row of rows) {
    const item = appState.income.find(entry => entry.id === row.dataset.id);
    if (!item) continue;
    const definitionKey = getRecurringDefinitionKey(item);
    const matchingEntries = (appState.income || []).filter(entry => getBookRepeatCycle(entry) && getRecurringDefinitionKey(entry) === definitionKey);
    if (row.dataset.remove === 'true') {
      matchingEntries.forEach(entry => updateIncome(entry.id, { repeatCycle: '', recurring: false }));
      continue;
    }
    const name = stripHtml($('.recurring-manager-name-input', row)?.value || '', 80);
    const amount = Math.max(0, safeNum($('.recurring-manager-amount', row)?.value));
    const date = $('.recurring-manager-date', row)?.value || item.date;
    const cycle = ['monthly', 'yearly'].includes($('.recurring-manager-cycle', row)?.value) ? $('.recurring-manager-cycle', row).value : '';
    if (!name || amount <= 0 || !isValidDate(date)) { showToast('반복 내역의 이름·날짜·금액을 확인해 주세요', 'error'); return; }
    if (!cycle) {
      matchingEntries.forEach(entry => updateIncome(entry.id, { repeatCycle: '', recurring: false }));
    } else {
      if (name !== String(item.item || item.source || getBookCategory(item).label).trim()) {
        matchingEntries.forEach(entry => updateIncome(entry.id, { item: name }));
      }
      updateIncome(item.id, { item: name, amount, date, repeatCycle: cycle, recurring: cycle === 'monthly' });
    }
  }
  closeModal('modalSub');
  showToast('반복 내역을 수정했어요', 'success');
  renderIncome();
}

function renderBookCategoryChart(items) {
  destroyChart('incPie');
  const type = getCategoryChartType(items);
  const typeItems = items.filter(i => getBookType(i) === type);
  const byCat = {};
  for (const i of typeItems) {
    if (type === 'expense') addBookCategoryAllocations(byCat, i);
    else byCat[i.cat] = (byCat[i.cat] || 0) + safeNum(i.amount);
  }
  const catEntries = Object.entries(byCat).filter(([, v]) => v > 0);
  if (catEntries.length === 0) return;

  const map = getBookCategoryMap(type);
  const total = typeItems.reduce((s, i) => s + (type === 'expense' ? getBookNetExpenseAmount(i) : safeNum(i.amount)), 0);
  charts.incPie = renderDoughnut('chartIncPie',
    catEntries.map(([id]) => (map[id]?.label || id)),
    catEntries.map(([, v]) => v),
    catEntries.map(([id]) => getBookCategoryColor(type, id)),
    { centerText: { text: fmtKRW(total), sub: getBookTypeMeta(type).label, fontSize: 13 } }
  );

  const altContainer = document.getElementById('chartIncPieAlt');
  if (altContainer) {
    const rows = catEntries.map(([id, v]) => {
      const pct = total > 0 ? ((v / total) * 100).toFixed(1) + '%' : '0%';
      return [(map[id]?.label || id), fmtKRW(v), pct];
    });
    altContainer.innerHTML = chartAltTable(['카테고리', '금액', '비중'], rows, `${getBookTypeMeta(type).label} 카테고리 데이터`);
  }
}

function renderBookFlowChart(year, month) {
  destroyChart('incBar');
  const months = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i, y = year;
    while (m <= 0) { m += 12; y--; }
    months.push({ y, m, label: `${m}월` });
  }
  const incomeData = [];
  const expenseData = [];
  const netData = [];
  for (const m of months) {
    const summary = calcBookSummary(getMonthIncome(m.y, m.m));
    incomeData.push(summary.income);
    expenseData.push(summary.expense);
    netData.push(summary.net);
  }
  if (![...incomeData, ...expenseData, ...netData].some(v => v !== 0)) return;
  charts.incBar = renderLineChart('chartIncBar', months.map(m => m.label), [
    { label: '수입', data: incomeData, borderColor: '#8172D8', backgroundColor: colorAlpha('#8172D8', 0.16), fill: false },
    { label: '지출', data: expenseData, borderColor: '#E45D72', backgroundColor: colorAlpha('#E45D72', 0.16), fill: false },
    { label: '순흐름', data: netData, borderColor: getThemeColor('--primary') || '#0057E7', backgroundColor: colorAlpha('#0057E7', 0.12), fill: false },
  ], { legend: true, pointRadius: 3, tension: 0.25 });

  const altContainer = document.getElementById('chartIncBarAlt');
  if (altContainer) {
    const rows = months.map((m, idx) => [m.label, fmtKRW(incomeData[idx]), fmtKRW(expenseData[idx]), fmtKRW(netData[idx])]);
    altContainer.innerHTML = chartAltTable(['월', '수입', '지출', '순흐름'], rows, '6개월 가계부 흐름 데이터');
  }
}

function changeMonth(delta) {
  let [y, m] = UIState.incomeMonth.split('-').map(Number);
  m += delta;
  if (m > 12) { m = 1; y++; }
  if (m < 1) { m = 12; y--; }
  UIState.incomeMonth = `${y}-${String(m).padStart(2, '0')}`;
  renderIncome();
}

function _renderLedgerSourceDatalist(type, listId) {
  const presets = loadPresets();
  const key = type === 'expense' ? 'expenseSources' : 'incomeSources';
  const list = Array.isArray(presets[key]) ? presets[key] : [];
  if (list.length === 0) return '';
  return `<datalist id="${listId}">${list.map(v => `<option value="${escAttr(v)}"></option>`).join('')}</datalist>`;
}

function renderLedgerCatSelector(type, selectedCat, labelId) {
  const cats = getBookCategories(type);
  const map = getBookCategoryMap(type);
  const fallback = getBookTypeMeta(type).defaultCat;
  const selected = map[selectedCat] ? selectedCat : fallback;
  return `<div class="cat-select" role="radiogroup" aria-labelledby="${labelId}">
    ${cats.map(c => `<button class="cat-btn ${c.id === selected ? 'active' : ''}" style="--book-cat-color:${escAttr(getBookCategoryColor(type, c.id))}"
      data-cat="${escAttr(c.id)}" data-action="select-book-cat" role="radio"
      aria-checked="${c.id === selected ? 'true' : 'false'}">${c.icon} ${escHtml(c.label)}</button>`).join('')}</div>`;
}

function renderLedgerSubcategoryField(type, catId, selectedSubcat = '') {
  const suggestions = getBookSubcategorySuggestions(type, catId);
  const clean = stripHtml(selectedSubcat, 40);
  const isCustom = !!clean && !suggestions.includes(clean);
  return `
    <input type="hidden" id="ledgerSubcat" value="${escAttr(clean)}">
    <div class="ledger-subcat-choices" role="radiogroup" aria-labelledby="ledgerSubcatLabel">
      ${suggestions.map(label => `<button type="button" class="ledger-subcat-choice ${label === clean ? 'active' : ''}"
        data-action="select-book-subcat" data-subcat="${escAttr(label)}" role="radio"
        aria-checked="${label === clean}">${escHtml(label)}</button>`).join('')}
      <button type="button" class="ledger-subcat-choice ledger-subcat-custom-toggle ${isCustom ? 'active' : ''}"
        data-action="custom-book-subcat" role="radio" aria-checked="${isCustom}">+ 직접 입력</button>
    </div>
    <input type="text" id="ledgerSubcatCustom" class="ledger-subcat-custom ${isCustom ? '' : 'hidden'}"
      value="${isCustom ? escAttr(clean) : ''}" placeholder="소분류 이름을 입력하세요" maxlength="40" autocomplete="off">
  `;
}

function _refreshLedgerSubcategory(type, catId, selectedSubcat = '') {
  const wrap = $('#ledgerSubcatWrap');
  if (wrap) wrap.innerHTML = renderLedgerSubcategoryField(type, catId, selectedSubcat);
}

function renderLedgerLineSubcategoryOptions(catId, selectedSubcat = '') {
  const suggestions = getBookSubcategorySuggestions('expense', catId);
  const clean = stripHtml(selectedSubcat || '', 40);
  const options = clean && !suggestions.includes(clean) ? [clean, ...suggestions] : suggestions;
  return `<option value="">소분류 선택</option>${options.map(label =>
    `<option value="${escAttr(label)}" ${label === clean ? 'selected' : ''}>${escHtml(label)}</option>`).join('')}`;
}

function renderLedgerLineItemRow(line = {}, fallbackCat = 'other') {
  const map = getBookCategoryMap('expense');
  const cat = map[line.cat] ? line.cat : (map[fallbackCat] ? fallbackCat : 'other');
  const qty = Math.max(1, Math.floor(safeNum(line.qty) || 1));
  const unitPrice = Math.max(0, safeNum(line.unitPrice) || (safeNum(line.amount) / qty));
  return `<div class="book-line-item-editor-row">
    <div class="book-line-item-editor-main">
      <input type="text" class="book-line-item-name" value="${escAttr(line.name || '')}" placeholder="품목 이름" maxlength="120" aria-label="나눈 품목 이름">
      <label class="book-line-item-qty-wrap"><span class="sr-only">수량</span><input type="number" inputmode="numeric" class="book-line-item-qty" value="${escAttr(qty)}" min="1" step="1" aria-label="나눈 품목 수량"><small>개 ×</small></label>
      <input type="number" inputmode="decimal" class="book-line-item-unit-price" value="${unitPrice ? escAttr(unitPrice) : ''}" placeholder="개당 가격" min="0" aria-label="나눈 품목 개당 가격">
      <strong class="book-line-item-row-total">${escHtml(fmtKRW(qty * unitPrice))}</strong>
    </div>
    <div class="book-line-item-editor-meta">
      <select class="book-line-item-cat" aria-label="나눈 품목 대분류">
        ${getBookCategories('expense').map(category => `<option value="${escAttr(category.id)}" ${category.id === cat ? 'selected' : ''}>${category.icon} ${escHtml(category.label)}</option>`).join('')}
      </select>
      <select class="book-line-item-subcat" aria-label="나눈 품목 소분류">
        ${renderLedgerLineSubcategoryOptions(cat, line.subcat || '')}
      </select>
      <button type="button" class="btn-icon btn-danger" data-action="delete-ledger-line-item" aria-label="나눈 품목 삭제">✕</button>
    </div>
  </div>`;
}

function renderLedgerLineItemsBlock(type, lineItems = [], fallbackCat = 'other') {
  const enabled = type === 'expense' && lineItems.length > 0;
  return `<div id="ledgerLineItemsBlock" class="ledger-line-items-block ${type === 'expense' ? '' : 'hidden'}">
    <input type="hidden" id="ledgerSplitEnabled" value="${enabled ? 'true' : 'false'}">
    <button type="button" class="ledger-split-toggle ${enabled ? 'active' : ''}" data-action="toggle-ledger-line-items" aria-pressed="${enabled}">
      <span>🧾 품목 나누기</span><small>한 번의 결제를 여러 품목·카테고리로 기록</small>
    </button>
    <div id="ledgerLineItemsDetails" class="ledger-line-items-details ${enabled ? '' : 'hidden'}">
      <div id="ledgerLineItemList">${lineItems.map(line => renderLedgerLineItemRow(line, fallbackCat)).join('')}</div>
      <button type="button" class="btn-sm ledger-line-item-add" data-action="add-ledger-line-item">+ 품목 추가</button>
      <div id="ledgerLineItemSum" class="ledger-line-item-sum"></div>
    </div>
  </div>`;
}

function readLedgerLineItemDrafts() {
  return $$('.book-line-item-editor-row', $('#ledgerLineItemList')).map(row => {
    const qty = Math.max(1, Math.floor(safeNum($('.book-line-item-qty', row)?.value) || 1));
    const unitPrice = Math.max(0, safeNum($('.book-line-item-unit-price', row)?.value));
    return {
      id: uid(),
      name: stripHtml($('.book-line-item-name', row)?.value || '', 120),
      qty,
      unitPrice,
      amount: qty * unitPrice,
      cat: getBookCategoryMap('expense')[$('.book-line-item-cat', row)?.value]
        ? $('.book-line-item-cat', row).value : 'other',
      subcat: stripHtml($('.book-line-item-subcat', row)?.value || '', 40),
    };
  });
}

function refreshLedgerLineItemSum() {
  const hint = $('#ledgerLineItemSum');
  if (!hint) return;
  const drafts = readLedgerLineItemDrafts();
  $$('.book-line-item-editor-row', $('#ledgerLineItemList')).forEach((row, index) => {
    const totalNode = $('.book-line-item-row-total', row);
    if (totalNode) totalNode.textContent = fmtKRW(drafts[index]?.amount || 0);
  });
  const total = drafts.reduce((sum, line) => sum + line.amount, 0);
  const paymentTotal = Math.max(0, safeNum($('#ledgerAmount')?.value));
  const discountEnabled = !!$('#ledgerDiscountEnabled')?.checked;
  if ($('#ledgerSplitEnabled')?.value === 'true' && discountEnabled) {
    const originalInput = $('#ledgerOriginalAmount');
    if (originalInput) originalInput.value = total || '';
  }
  const discount = Math.max(0, total - paymentTotal);
  const matches = paymentTotal > 0 && (discountEnabled ? total >= paymentTotal : Math.abs(total - paymentTotal) < 0.01);
  hint.classList.toggle('is-match', matches);
  hint.classList.toggle('is-different', total > 0 && !matches);
  hint.textContent = discountEnabled
    ? `품목 합계 ${fmtKRW(total)} - 할인 ${fmtKRW(discount)} = 실제 결제액 ${fmtKRW(paymentTotal)}${matches ? ' · 확인' : ''}`
    : `품목 합계 ${fmtKRW(total)} / 실제 결제액 ${fmtKRW(paymentTotal)}${matches ? ' · 일치' : ''}`;
  _refreshLedgerDiscountHint();
}

function _setupIncomeAmountHint(inputId, hintId) {
  const input = $(`#${inputId}`);
  const hint = $(`#${hintId}`);
  if (!input || !hint) return;
  const update = () => { hint.textContent = fmtAmountHint(input.value); };
  _modalCleanup.add(input, 'input', update);
  update();
}

function _renderLedgerTypeToggle(type) {
  return `
    <div class="book-type-toggle" role="radiogroup" aria-label="내역 유형">
      ${['expense', 'income', 'saving'].map(t => `
        <button type="button" class="book-type-option ${type === t ? 'active' : ''}"
          data-action="set-ledger-type" data-type="${t}" role="radio"
          aria-checked="${type === t ? 'true' : 'false'}">
          ${escHtml(getBookTypeMeta(t).label)}
        </button>
      `).join('')}
    </div>
    <input type="hidden" id="ledgerType" value="${escAttr(type)}">
  `;
}

function renderLedgerSpendingTraits(type, catId, subcat = '', selected = {}, repeatCycle = '') {
  const defaults = getDefaultBookSpendingTraits(type, catId, subcat, !!repeatCycle);
  const costType = ['fixed', 'variable'].includes(selected.costType) ? selected.costType : defaults.costType;
  const needType = ['essential', 'optional'].includes(selected.needType) ? selected.needType : defaults.needType;
  return `<div id="ledgerSpendingTraits" class="ledger-traits ${type === 'expense' ? '' : 'hidden'}">
    <div class="ledger-traits-head">
      <span>지출 성격</span><small>카테고리에 맞춰 자동 선택되며 바꿀 수 있어요.</small>
    </div>
    <div class="ledger-trait-row">
      <span class="ledger-trait-label">지출 형태</span>
      <div class="ledger-trait-options" role="radiogroup" aria-label="지출 형태">
        ${[['fixed', '고정비'], ['variable', '변동비']].map(([value, label]) => `<button type="button"
          class="ledger-trait-choice cost-${value} ${costType === value ? 'active' : ''}"
          data-action="set-ledger-trait" data-field="costType" data-value="${value}" role="radio"
          aria-checked="${costType === value}">${label}</button>`).join('')}
      </div>
      <input type="hidden" id="ledgerCostType" value="${escAttr(costType)}">
    </div>
    <div class="ledger-trait-row">
      <span class="ledger-trait-label">소비 성격</span>
      <div class="ledger-trait-options" role="radiogroup" aria-label="소비 성격">
        ${[['essential', '필수'], ['optional', '선택']].map(([value, label]) => `<button type="button"
          class="ledger-trait-choice need-${value} ${needType === value ? 'active' : ''}"
          data-action="set-ledger-trait" data-field="needType" data-value="${value}" role="radio"
          aria-checked="${needType === value}">${label}</button>`).join('')}
      </div>
      <input type="hidden" id="ledgerNeedType" value="${escAttr(needType)}">
    </div>
  </div>`;
}

function renderLedgerSavingFields(type, catId, included) {
  const checked = type === 'saving' && (typeof included === 'boolean' ? included : catId !== 'transfer');
  return `<div id="ledgerSavingFields" class="ledger-saving-fields ${type === 'saving' ? '' : 'hidden'}">
    <label class="ledger-check-row">
      <input type="checkbox" id="ledgerSavingIncluded" ${checked ? 'checked' : ''}>
      <span><strong>저축액에 포함</strong><small>월 저축액과 저축률에 반영해요. 단순 자산이동은 체크를 꺼두세요.</small></span>
    </label>
  </div>`;
}

function renderLedgerTransferAccounts(type, fromAccount = '', toAccount = '') {
  return `<div id="ledgerTransferAccountsBlock" class="ledger-transfer-accounts ${type === 'saving' ? '' : 'hidden'}">
    <div class="form-label-with-action ledger-account-head">
      <label>출금·입금 계좌</label>
      <button type="button" class="form-label-edit" data-action="open-book-account-manager" aria-label="통장·계좌 관리" title="통장·계좌 관리">✎ 관리</button>
    </div>
    <div class="form-row ledger-account-pair">
      <div class="form-group">
        <label>출금 계좌 *</label>
        <div id="ledgerFromAccountWrap">${renderLedgerAccountSelector('fromAccount', fromAccount)}</div>
      </div>
      <div class="ledger-account-arrow" aria-hidden="true">→</div>
      <div class="form-group">
        <label>입금 계좌 *</label>
        <div id="ledgerToAccountWrap">${renderLedgerAccountSelector('toAccount', toAccount)}</div>
      </div>
    </div>
    <div class="ledger-account-tip">실제 계좌번호는 저장하지 않고, 직접 정한 통장 이름만 사용해요.</div>
  </div>`;
}

function _refreshLedgerSavingFields(forceDefault = false) {
  const wrap = $('#ledgerSavingFieldsWrap');
  if (!wrap) return;
  const type = normalizeBookType($('#ledgerType')?.value, 'expense');
  const cat = $('#modalMain .cat-btn.active')?.dataset?.cat || getBookTypeMeta(type).defaultCat;
  const included = forceDefault ? undefined : !!$('#ledgerSavingIncluded')?.checked;
  wrap.innerHTML = renderLedgerSavingFields(type, cat, included);
}

function _refreshLedgerSpendingTraits(forceDefaults = true) {
  const wrap = $('#ledgerSpendingTraitsWrap');
  if (!wrap) return;
  const type = normalizeBookType($('#ledgerType')?.value, 'expense');
  const cat = $('#modalMain .cat-btn.active')?.dataset?.cat || getBookTypeMeta(type).defaultCat;
  const subcat = stripHtml($('#ledgerSubcat')?.value || '', 40);
  const selected = forceDefaults ? {} : {
    costType: $('#ledgerCostType')?.value || '',
    needType: $('#ledgerNeedType')?.value || '',
  };
  wrap.innerHTML = renderLedgerSpendingTraits(type, cat, subcat, selected, $('#ledgerRepeatCycle')?.value || '');
}

function renderLedgerRepeatFields(type, repeatCycle = '', subscription = false) {
  const cycle = ['monthly', 'yearly'].includes(repeatCycle) ? repeatCycle : '';
  return `<div class="ledger-repeat-block">
    <div class="ledger-repeat-head"><span>반복</span><small>다음 달이나 내년 같은 달에 한 번에 가져올 수 있어요</small></div>
    <div class="ledger-repeat-options" role="radiogroup" aria-label="반복 주기">
      ${[['', '없음'], ['monthly', '매월'], ['yearly', '매년']].map(([value, label]) => `<button type="button"
        class="ledger-repeat-choice ${cycle === value ? 'active' : ''}" data-action="set-ledger-repeat-cycle"
        data-value="${value}" role="radio" aria-checked="${cycle === value}">${label}</button>`).join('')}
    </div>
    <input type="hidden" id="ledgerRepeatCycle" value="${escAttr(cycle)}">
    <label class="ledger-check-row ${type === 'expense' ? '' : 'hidden'}" id="ledgerSubscriptionRow">
      <input type="checkbox" id="ledgerSubscription" ${subscription ? 'checked' : ''}>
      <span><strong>구독·멤버십</strong><small>구독비를 따로 모아볼 수 있어요</small></span>
    </label>
  </div>`;
}

function renderLedgerAdvanceFields(type, amount, advanceAmount = 0, settledAmount = 0, settledDate = '') {
  const enabled = type === 'expense' && safeNum(advanceAmount) > 0;
  const expected = enabled ? safeNum(advanceAmount) : '';
  const settled = enabled ? safeNum(settledAmount) : '';
  return `<div id="ledgerAdvanceBlock" class="ledger-advance-block ${type === 'expense' ? '' : 'hidden'}">
    <label class="ledger-check-row">
      <input type="checkbox" id="ledgerAdvanceEnabled" ${enabled ? 'checked' : ''}>
      <span><strong>대납·정산</strong><small>가족이나 지인을 대신해 결제한 돈을 내 지출에서 분리해요</small></span>
    </label>
    <div id="ledgerAdvanceDetails" class="ledger-advance-details ${enabled ? '' : 'hidden'}">
      <div class="form-row">
        <div class="form-group">
          <label for="ledgerAdvanceAmount">돌려받을 금액</label>
          <input type="number" inputmode="decimal" id="ledgerAdvanceAmount" value="${escAttr(expected)}" min="0" max="${escAttr(amount || '')}" placeholder="0">
        </div>
        <div class="form-group">
          <label for="ledgerSettledAmount">이미 돌려받은 금액</label>
          <input type="number" inputmode="decimal" id="ledgerSettledAmount" value="${escAttr(settled)}" min="0" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label for="ledgerSettledDate">마지막 정산일</label>
        <input type="date" id="ledgerSettledDate" value="${escAttr(settledDate || '')}">
      </div>
      <div id="ledgerAdvanceHint" class="ledger-advance-hint"></div>
    </div>
  </div>`;
}

function _refreshLedgerAdvanceHint() {
  const hint = $('#ledgerAdvanceHint');
  if (!hint) return;
  const paid = Math.max(0, safeNum($('#ledgerAmount')?.value));
  const expected = Math.min(paid, Math.max(0, safeNum($('#ledgerAdvanceAmount')?.value)));
  const settled = Math.min(expected, Math.max(0, safeNum($('#ledgerSettledAmount')?.value)));
  hint.innerHTML = `내 지출 <strong>${escHtml(fmtKRW(Math.max(0, paid - expected)))}</strong> · 아직 받을 돈 <strong>${escHtml(fmtKRW(Math.max(0, expected - settled)))}</strong>`;
}

function renderLedgerDiscountFields(type, amount, originalAmount = 0, splitEnabled = false) {
  const enabled = type === 'expense' && safeNum(originalAmount) > safeNum(amount);
  return `<div id="ledgerDiscountBlock" class="ledger-discount-block ${type === 'expense' ? '' : 'hidden'}">
    <label class="ledger-check-row">
      <input type="checkbox" id="ledgerDiscountEnabled" ${enabled ? 'checked' : ''}>
      <span><strong>할인·쿠폰·포인트 기록</strong><small>할인 전 상품 금액을 먼저 적고, 아래에는 실제로 빠져나간 금액만 적으세요.</small></span>
    </label>
    <div id="ledgerDiscountDetails" class="ledger-discount-details ${enabled ? '' : 'hidden'}">
      <div id="ledgerDiscountManual" class="form-group ${splitEnabled ? 'hidden' : ''}">
        <label for="ledgerOriginalAmount">할인 전 상품 금액</label>
        <input type="number" inputmode="decimal" id="ledgerOriginalAmount" value="${enabled ? escAttr(originalAmount) : ''}" min="0" placeholder="예: 3000">
      </div>
      <div id="ledgerDiscountAuto" class="ledger-discount-auto ${splitEnabled ? '' : 'hidden'}">
        품목 합계를 할인 전 금액으로 자동 사용해요.
      </div>
      <div id="ledgerDiscountHint" class="ledger-discount-hint"></div>
    </div>
  </div>`;
}

function _refreshLedgerDiscountHint() {
  const hint = $('#ledgerDiscountHint');
  if (!hint) return;
  const paid = Math.max(0, safeNum($('#ledgerAmount')?.value));
  const original = Math.max(0, safeNum($('#ledgerOriginalAmount')?.value));
  const discount = Math.max(0, original - paid);
  hint.innerHTML = original > 0 && original < paid
    ? '<span class="negative">할인 전 금액은 실제 결제액보다 커야 해요.</span>'
    : `할인 <strong>${escHtml(fmtKRW(discount))}</strong> · 실제 지출 <strong>${escHtml(fmtKRW(paid))}</strong>`;
}

function _syncLedgerDiscountMode() {
  const splitEnabled = $('#ledgerSplitEnabled')?.value === 'true';
  $('#ledgerDiscountManual')?.classList.toggle('hidden', splitEnabled);
  $('#ledgerDiscountAuto')?.classList.toggle('hidden', !splitEnabled);
  if (splitEnabled && $('#ledgerDiscountEnabled')?.checked) {
    const total = readLedgerLineItemDrafts().reduce((sum, line) => sum + line.amount, 0);
    const originalInput = $('#ledgerOriginalAmount');
    if (originalInput) originalInput.value = total || '';
  }
  _refreshLedgerDiscountHint();
}

function _refreshLedgerFormForType(type, selectedCat) {
  const cleanType = normalizeBookType(type, 'expense');
  const meta = getBookTypeMeta(cleanType);
  const typeInput = $('#ledgerType');
  if (typeInput) typeInput.value = cleanType;
  $$('#modalMain [data-action="set-ledger-type"]').forEach(btn => {
    const active = btn.dataset.type === cleanType;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  });
  const catWrap = $('#ledgerCatWrap');
  const nextCat = selectedCat || meta.defaultCat;
  if (catWrap) catWrap.innerHTML = renderLedgerCatSelector(cleanType, nextCat, 'ledgerCatLabel');
  _refreshLedgerSubcategory(cleanType, nextCat, '');
  const sourceLabel = $('#ledgerSourceLabel');
  if (sourceLabel) sourceLabel.textContent = meta.sourceLabel;
  const sourceManagerButton = $('#ledgerSourceManagerButton');
  const sourceSuggestionManager = $('#ledgerSourceSuggestionManager');
  const sourceKind = cleanType === 'income' ? 'incomeSources' : 'expenseSources';
  if (sourceManagerButton) { sourceManagerButton.dataset.kind = sourceKind; sourceManagerButton.textContent = '목록 관리'; }
  if (sourceSuggestionManager) {
    sourceSuggestionManager.dataset.suggestionKind = sourceKind;
    sourceSuggestionManager.innerHTML = renderRememberedSuggestionList(sourceKind);
    sourceSuggestionManager.classList.add('hidden');
  }
  const source = $('#ledgerSource');
  if (source) {
    source.placeholder = meta.sourcePlaceholder;
    const listId = cleanType === 'expense' ? 'expenseSourcePresets' : cleanType === 'income' ? 'incomeSourcePresets' : '';
    if (listId) source.setAttribute('list', listId);
    else source.removeAttribute('list');
  }
  const datalistWrap = $('#ledgerDatalistWrap');
  if (datalistWrap) {
    datalistWrap.innerHTML =
      _renderLedgerSourceDatalist('expense', 'expenseSourcePresets') +
      _renderLedgerSourceDatalist('income', 'incomeSourcePresets');
  }
  $('#ledgerSubscriptionRow')?.classList.toggle('hidden', cleanType !== 'expense');
  $('#ledgerAdvanceBlock')?.classList.toggle('hidden', cleanType !== 'expense');
  $('#ledgerDiscountBlock')?.classList.toggle('hidden', cleanType !== 'expense');
  $('#ledgerLineItemsBlock')?.classList.toggle('hidden', cleanType !== 'expense');
  const splitActive = cleanType === 'expense' && $('#ledgerSplitEnabled')?.value === 'true';
  $('#ledgerSingleItemBlock')?.classList.toggle('hidden', splitActive);
  $('#ledgerTransferAccountsBlock')?.classList.toggle('hidden', cleanType !== 'saving');
  $('#ledgerSourceBlock')?.classList.toggle('hidden', cleanType === 'saving');
  $('#ledgerPaymentBlock')?.classList.toggle('hidden', cleanType === 'saving');
  _refreshLedgerSavingFields(true);
  const amountLabel = $('#ledgerAmountLabel');
  if (amountLabel) amountLabel.textContent = cleanType === 'expense' ? '실제 결제액 *' : cleanType === 'saving' ? '저축·이체 금액 *' : '금액 *';
  const itemLabel = $('#ledgerItemLabel');
  if (itemLabel) itemLabel.textContent = cleanType === 'expense' ? '품목' : cleanType === 'saving' ? '저축 내용' : '수입 내용';
  const itemInput = $('#ledgerItem');
  if (itemInput) itemInput.placeholder = cleanType === 'expense' ? '예: 우유, 생활용품' : cleanType === 'saving' ? '예: 8월 정기적금' : '예: 8월 급여';
  const memoInput = $('#ledgerMemo');
  if (memoInput) memoInput.placeholder = '필요한 설명이 있을 때만 입력하세요';
  const paymentLabel = $('#ledgerPaymentLabel');
  if (paymentLabel) paymentLabel.textContent = '결제/입금 수단';
  _refreshLedgerSpendingTraits(true);
}

function _setupLedgerFormInteractions(container) {
  const handler = (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'set-ledger-type') {
      _refreshLedgerFormForType(target.dataset.type, null);
    } else if (action === 'select-book-cat') {
      const group = target.closest('.cat-select');
      if (group) group.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      target.classList.add('active');
      target.setAttribute('aria-checked', 'true');
      const type = normalizeBookType($('#ledgerType')?.value, 'expense');
      _refreshLedgerSubcategory(type, target.dataset.cat, '');
      _refreshLedgerSpendingTraits(true);
      _refreshLedgerSavingFields(true);
    } else if (action === 'select-book-subcat') {
      const wrap = target.closest('#ledgerSubcatWrap');
      $$('.ledger-subcat-choice', wrap).forEach(button => {
        const active = button === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
      const value = stripHtml(target.dataset.subcat || '', 40);
      const hidden = $('#ledgerSubcat', wrap);
      const custom = $('#ledgerSubcatCustom', wrap);
      if (hidden) hidden.value = value;
      if (custom) { custom.value = ''; custom.classList.add('hidden'); }
      _refreshLedgerSpendingTraits(true);
    } else if (action === 'custom-book-subcat') {
      const wrap = target.closest('#ledgerSubcatWrap');
      $$('.ledger-subcat-choice', wrap).forEach(button => {
        const active = button === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
      const custom = $('#ledgerSubcatCustom', wrap);
      const hidden = $('#ledgerSubcat', wrap);
      if (custom) { custom.classList.remove('hidden'); custom.focus(); }
      if (hidden) hidden.value = custom?.value || '';
      _refreshLedgerSpendingTraits(true);
    } else if (action === 'set-ledger-trait') {
      const field = target.dataset.field;
      const input = field === 'costType' ? $('#ledgerCostType') : field === 'needType' ? $('#ledgerNeedType') : null;
      const group = target.closest('.ledger-trait-options');
      if (!input || !group) return;
      input.value = target.dataset.value || '';
      $$('.ledger-trait-choice', group).forEach(button => {
        const active = button === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
    } else if (action === 'set-ledger-repeat-cycle') {
      const input = $('#ledgerRepeatCycle');
      if (!input) return;
      input.value = target.dataset.value || '';
      target.closest('.ledger-repeat-options')?.querySelectorAll('.ledger-repeat-choice').forEach(button => {
        const active = button === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
      _refreshLedgerSpendingTraits(false);
    } else if (action === 'select-book-payment') {
      const input = $('#ledgerPayment');
      if (!input) return;
      input.value = stripHtml(target.dataset.payment || '', 40);
      target.closest('.ledger-payment-choices')?.querySelectorAll('.ledger-payment-choice').forEach(button => {
        const active = button === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
    } else if (action === 'select-book-account') {
      const field = target.dataset.accountField;
      const input = field === 'fromAccount' ? $('#ledgerFromAccount') : field === 'toAccount' ? $('#ledgerToAccount') : null;
      if (!input) return;
      input.value = stripHtml(target.dataset.account || '', 80);
      target.closest('.ledger-account-choices')?.querySelectorAll('.ledger-payment-choice').forEach(button => {
        const active = button === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
    } else if (action === 'open-book-payment-manager') {
      openBookPaymentManager();
    } else if (action === 'open-book-account-manager') {
      openBookAccountManager();
    } else if (action === 'toggle-remembered-suggestions') {
      toggleRememberedSuggestions(target);
    } else if (action === 'delete-remembered-suggestion') {
      deleteRememberedSuggestion(target);
    } else if (action === 'toggle-ledger-attachments') {
      const details = $('#ledgerAttachmentDetails');
      if (!details) return;
      const open = details.classList.contains('hidden');
      details.classList.toggle('hidden', !open);
      target.setAttribute('aria-expanded', String(open));
      target.closest('.ledger-attachment-block')?.classList.toggle('is-open', open);
    } else if (action === 'toggle-ledger-line-items') {
      const input = $('#ledgerSplitEnabled');
      const details = $('#ledgerLineItemsDetails');
      const list = $('#ledgerLineItemList');
      if (!input || !details || !list) return;
      const enabled = input.value !== 'true';
      input.value = String(enabled);
      target.classList.toggle('active', enabled);
      target.setAttribute('aria-pressed', String(enabled));
      details.classList.toggle('hidden', !enabled);
      $('#ledgerSingleItemBlock')?.classList.toggle('hidden', enabled);
      if (enabled && !list.children.length) {
        const parentCat = $('#modalMain .cat-btn.active')?.dataset?.cat || 'other';
        list.insertAdjacentHTML('beforeend', renderLedgerLineItemRow({}, parentCat));
      }
      _syncLedgerDiscountMode();
      refreshLedgerLineItemSum();
    } else if (action === 'add-ledger-line-item') {
      const list = $('#ledgerLineItemList');
      if (!list) return;
      if (list.children.length >= 30) { showToast('품목은 최대 30개까지 나눌 수 있어요', 'error'); return; }
      const parentCat = $('#modalMain .cat-btn.active')?.dataset?.cat || 'other';
      list.insertAdjacentHTML('beforeend', renderLedgerLineItemRow({}, parentCat));
      $('.book-line-item-editor-row:last-child .book-line-item-name', list)?.focus();
      refreshLedgerLineItemSum();
    } else if (action === 'delete-ledger-line-item') {
      target.closest('.book-line-item-editor-row')?.remove();
      const list = $('#ledgerLineItemList');
      if ($('#ledgerSplitEnabled')?.value === 'true' && list && !list.children.length) {
        const parentCat = $('#modalMain .cat-btn.active')?.dataset?.cat || 'other';
        list.insertAdjacentHTML('beforeend', renderLedgerLineItemRow({}, parentCat));
      }
      refreshLedgerLineItemSum();
    } else if (action === 'remove-ledger-photo') {
      _ledgerAttachmentDraft = { imageData: '', imageName: '' };
      const fileInput = $('#ledgerReceiptFile');
      if (fileInput) fileInput.value = '';
      _refreshLedgerAttachmentUi();
    } else if (action === 'analyze-ledger-receipt') {
      analyzeLedgerReceipt();
    } else if (action === 'apply-ledger-receipt') {
      applyLedgerReceiptAnalysis();
    }
  };
  _modalCleanup.add(container, 'click', handler);
  const inputHandler = (e) => {
    if (e.target?.id === 'ledgerSubcatCustom') {
      const hidden = $('#ledgerSubcat', e.target.closest('#ledgerSubcatWrap'));
      if (hidden) hidden.value = stripHtml(e.target.value, 40);
      _refreshLedgerSpendingTraits(true);
    }
    if (['ledgerAmount', 'ledgerAdvanceAmount', 'ledgerSettledAmount'].includes(e.target?.id)) {
      _refreshLedgerAdvanceHint();
    }
    if (['ledgerAmount', 'ledgerOriginalAmount'].includes(e.target?.id)) _refreshLedgerDiscountHint();
    if (e.target?.id === 'ledgerAmount' || e.target?.closest('.book-line-item-editor-row')) refreshLedgerLineItemSum();
  };
  _modalCleanup.add(container, 'input', inputHandler);
  const changeHandler = e => {
    if (e.target?.id === 'ledgerReceiptFile') {
      const file = e.target.files?.[0];
      if (!file) return;
      const input = e.target;
      input.disabled = true;
      compressLedgerPhoto(file)
        .then(imageData => {
          _ledgerAttachmentDraft = { imageData, imageName: stripHtml(file.name || '첨부 사진.jpg', 100) };
          _refreshLedgerAttachmentUi();
          showToast('사진을 첨부했어요', 'success');
        })
        .catch(error => showToast(error.message || '사진을 첨부하지 못했습니다.', 'error'))
        .finally(() => { input.disabled = false; });
      return;
    }
    if (e.target?.classList?.contains('book-line-item-cat')) {
      const row = e.target.closest('.book-line-item-editor-row');
      const subcatSelect = $('.book-line-item-subcat', row);
      if (subcatSelect) subcatSelect.innerHTML = renderLedgerLineSubcategoryOptions(e.target.value, '');
      refreshLedgerLineItemSum();
    }
    if (e.target?.id === 'ledgerSubscription' && e.target.checked && !$('#ledgerRepeatCycle')?.value) {
      container.querySelector('[data-action="set-ledger-repeat-cycle"][data-value="monthly"]')?.click();
    }
    if (e.target?.id === 'ledgerAdvanceEnabled') {
      const details = $('#ledgerAdvanceDetails');
      details?.classList.toggle('hidden', !e.target.checked);
      if (e.target.checked && !safeNum($('#ledgerAdvanceAmount')?.value)) {
        $('#ledgerAdvanceAmount').value = Math.max(0, safeNum($('#ledgerAmount')?.value)) || '';
      }
      _refreshLedgerAdvanceHint();
    }
    if (e.target?.id === 'ledgerDiscountEnabled') {
      $('#ledgerDiscountDetails')?.classList.toggle('hidden', !e.target.checked);
      if (e.target.checked && $('#ledgerSplitEnabled')?.value !== 'true' && !safeNum($('#ledgerOriginalAmount')?.value)) {
        $('#ledgerOriginalAmount').value = Math.max(0, safeNum($('#ledgerAmount')?.value)) || '';
      }
      _syncLedgerDiscountMode();
      refreshLedgerLineItemSum();
    }
  };
  _modalCleanup.add(container, 'change', changeHandler);
  refreshLedgerLineItemSum();
}

function _defaultBookDate(year, month) {
  const todayDate = new Date();
  const day = Math.min(todayDate.getDate(), new Date(year, month, 0).getDate());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function _renderLedgerAttachmentPreview() {
  const hasImage = !!_ledgerAttachmentDraft.imageData;
  return `<div class="ledger-attachment-preview ${hasImage ? '' : 'is-empty'}">
    ${hasImage ? `<img src="${escAttr(_ledgerAttachmentDraft.imageData)}" alt="첨부한 영수증 또는 사진 미리보기">
      <div><strong>${escHtml(_ledgerAttachmentDraft.imageName || '첨부 사진')}</strong><small>사진은 압축되어 이 기기의 가계부 백업에 함께 저장돼요.</small></div>
      <button type="button" class="btn-s" data-action="remove-ledger-photo">삭제</button>`
      : '<span>아직 첨부한 사진이 없어요.</span>'}
  </div>`;
}

function renderLedgerAttachmentFields(relatedUrl = '') {
  const open = !!relatedUrl || !!_ledgerAttachmentDraft.imageData;
  return `<section class="ledger-attachment-block ${open ? 'is-open' : ''}" aria-label="링크와 사진 첨부">
    <button type="button" class="ledger-attachment-toggle" data-action="toggle-ledger-attachments" aria-expanded="${open}"><span>＋ 링크·사진 첨부</span><small>선택 사항</small></button>
    <div class="ledger-attachment-details ${open ? '' : 'hidden'}" id="ledgerAttachmentDetails">
    <div class="ledger-attachment-head"><span>링크 · 사진</span><small>상품 링크나 영수증 사진을 내역과 같이 보관해요.</small></div>
    <div class="form-group">
      <label for="ledgerRelatedUrl">관련 링크</label>
      <input type="url" id="ledgerRelatedUrl" value="${escAttr(relatedUrl)}" placeholder="https://…" maxlength="2048" inputmode="url">
    </div>
    <div class="form-group">
      <label for="ledgerReceiptFile">사진 또는 영수증</label>
      <input class="ledger-photo-input" type="file" id="ledgerReceiptFile" accept="image/jpeg,image/png,image/webp">
      <label class="ledger-photo-select" for="ledgerReceiptFile">📷 사진 선택</label>
      <div id="ledgerAttachmentPreview">${_renderLedgerAttachmentPreview()}</div>
    </div>
    <div class="ledger-receipt-ai-row ${_ledgerAttachmentDraft.imageData ? '' : 'hidden'}" id="ledgerReceiptAiRow">
      <button type="button" class="btn-s ledger-receipt-ai-btn" data-action="analyze-ledger-receipt">✨ AI로 영수증 읽기</button>
      <small>버튼을 누를 때만 사진이 Gemini로 전송돼요. 저장 전 결과를 직접 확인할 수 있어요.</small>
    </div>
    <div id="ledgerReceiptAnalysis" aria-live="polite"></div>
    </div>
  </section>`;
}

function _readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('사진을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

function _loadLedgerImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('사진 형식을 읽지 못했습니다.'));
    image.src = src;
  });
}

async function compressLedgerPhoto(file) {
  if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type || '')) throw new Error('JPG, PNG, WEBP 사진만 첨부할 수 있어요.');
  if (file.size > 15 * 1024 * 1024) throw new Error('사진은 15MB 이하로 선택해 주세요.');
  const source = await _readImageFile(file);
  const image = await _loadLedgerImage(source);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.76;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 850000 && quality > 0.38) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > 900000) throw new Error('사진을 충분히 줄이지 못했어요. 화면을 잘라 다시 선택해 주세요.');
  return dataUrl;
}

function _refreshLedgerAttachmentUi() {
  const preview = $('#ledgerAttachmentPreview');
  if (preview) preview.innerHTML = _renderLedgerAttachmentPreview();
  $('#ledgerReceiptAiRow')?.classList.toggle('hidden', !_ledgerAttachmentDraft.imageData);
  const analysis = $('#ledgerReceiptAnalysis');
  if (analysis) analysis.innerHTML = '';
  _ledgerReceiptAnalysis = null;
}

function _renderLedgerReceiptAnalysis(result) {
  const itemTotal = result.items.reduce((sum, item) => sum + item.amount, 0);
  return `<div class="ledger-receipt-review">
    <div class="ledger-receipt-review-title"><strong>AI가 읽은 내용</strong><span>아직 입력칸에는 반영되지 않았어요.</span></div>
    <dl>
      <div><dt>날짜</dt><dd>${escHtml(result.date || '인식 못함')}</dd></div>
      <div><dt>사용처</dt><dd>${escHtml(result.source || '인식 못함')}</dd></div>
      <div><dt>실제 결제액</dt><dd>${result.actualAmount > 0 ? escHtml(fmtKRW(result.actualAmount)) : '인식 못함'}</dd></div>
      <div><dt>품목</dt><dd>${result.items.length ? `${result.items.length}개 · ${escHtml(fmtKRW(itemTotal))}` : '인식 못함'}</dd></div>
      ${result.discount > 0 ? `<div><dt>할인</dt><dd>${escHtml(fmtKRW(result.discount))}</dd></div>` : ''}
    </dl>
    ${result.memo ? `<p>확인 메모: ${escHtml(result.memo)}</p>` : ''}
    <button type="button" class="btn-p" data-action="apply-ledger-receipt">입력칸에 적용</button>
  </div>`;
}

async function analyzeLedgerReceipt() {
  if (!_ledgerAttachmentDraft.imageData) return;
  const wrap = $('#ledgerReceiptAnalysis');
  const button = $('[data-action="analyze-ledger-receipt"]', $('#modalMain'));
  if (wrap) wrap.innerHTML = '<div class="ledger-receipt-loading"><span class="spinner"></span> 영수증을 읽고 있어요…</div>';
  if (button) button.disabled = true;
  try {
    _ledgerReceiptAnalysis = await analyzeGeminiReceipt(_ledgerAttachmentDraft.imageData);
    if (wrap) wrap.innerHTML = _renderLedgerReceiptAnalysis(_ledgerReceiptAnalysis);
  } catch (error) {
    if (wrap) wrap.innerHTML = `<div class="ledger-receipt-error">${escHtml(error.message || '영수증을 읽지 못했습니다.')}</div>`;
  } finally {
    if (button) button.disabled = false;
  }
}

function applyLedgerReceiptAnalysis() {
  const result = _ledgerReceiptAnalysis;
  if (!result) return;
  if ($('#ledgerType')?.value !== 'expense') $('[data-action="set-ledger-type"][data-type="expense"]', $('#modalMain'))?.click();
  if (result.source && $('#ledgerSource')) $('#ledgerSource').value = result.source;
  if (result.date && $('#ledgerDate')) $('#ledgerDate').value = result.date;
  if (result.actualAmount > 0 && $('#ledgerAmount')) $('#ledgerAmount').value = result.actualAmount;
  if (result.items.length >= 2) {
    if ($('#ledgerSplitEnabled')?.value !== 'true') $('[data-action="toggle-ledger-line-items"]', $('#modalMain'))?.click();
    const list = $('#ledgerLineItemList');
    const parentCat = $('#modalMain .cat-btn.active')?.dataset?.cat || 'other';
    if (list) list.innerHTML = result.items.map(item => renderLedgerLineItemRow(item, parentCat)).join('');
  } else if (result.items.length === 1 && $('#ledgerItem')) {
    $('#ledgerItem').value = result.items[0].name;
  }
  if (result.originalAmount > result.actualAmount && result.actualAmount > 0) {
    const discount = $('#ledgerDiscountEnabled');
    if (discount && !discount.checked) { discount.checked = true; discount.dispatchEvent(new Event('change', { bubbles: true })); }
    if ($('#ledgerOriginalAmount')) $('#ledgerOriginalAmount').value = result.originalAmount;
  }
  if (result.memo && $('#ledgerMemo') && !$('#ledgerMemo').value) $('#ledgerMemo').value = result.memo;
  refreshLedgerLineItemSum();
  _refreshLedgerDiscountHint();
  $('#ledgerAmount')?.dispatchEvent(new Event('input', { bubbles: true }));
  showToast('영수증 내용을 입력칸에 적용했어요. 저장 전에 확인해 주세요.', 'success');
}

function openLedgerReceiptImage(id) {
  const item = appState.income.find(entry => entry.id === id);
  if (!item?.receiptImage) return;
  const container = $('#modalSub');
  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box modal-large">
    <div class="modal-header"><h3>첨부 사진</h3><button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button></div>
    <div class="modal-body ledger-photo-viewer"><img src="${escAttr(item.receiptImage)}" alt="${escAttr(item.receiptImageName || '가계부 첨부 사진')}"></div>
  </div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container);
}

function _buildLedgerModalBody({ mode, item }) {
  const [year, month] = UIState.incomeMonth.split('-').map(Number);
  const isCopy = mode === 'copy';
  _ledgerAttachmentDraft = {
    imageData: !isCopy && item?.receiptImage ? item.receiptImage : '',
    imageName: !isCopy && item?.receiptImageName ? item.receiptImageName : '',
  };
  _ledgerReceiptAnalysis = null;
  const type = item ? getBookType(item) : 'expense';
  const meta = getBookTypeMeta(type);
  const amount = isCopy ? '' : item ? safeNum(item.amount) : '';
  const date = item ? (item.date || today()) : _defaultBookDate(year, month);
  const source = item ? (item.source || '') : '';
  const ledgerItem = isCopy ? '' : item ? (item.item || '') : '';
  const memo = isCopy ? '' : item ? (item.memo || '') : '';
  const relatedUrl = isCopy ? '' : item ? (item.relatedUrl || '') : '';
  const lineItems = isCopy ? [] : item ? getBookLineItems(item) : [];
  const repeatCycle = !isCopy && item ? getBookRepeatCycle(item) : '';
  const subscription = !isCopy && item ? !!item.subscription : false;
  const advance = !isCopy && item ? getBookAdvanceInfo(item) : { expected: 0, settled: 0 };
  const discount = !isCopy && item ? getBookDiscountInfo(item) : { original: 0 };
  const cat = item ? item.cat : meta.defaultCat;
  const subcat = item ? getBookSubcategoryLabel(item) : '';
  const payment = item ? (item.payment || '') : '';
  const fromAccount = item ? (item.fromAccount || '') : '';
  const toAccount = item ? (item.toAccount || '') : '';
  const traits = item ? getBookSpendingTraits(item) : getDefaultBookSpendingTraits(type, cat, subcat, !!repeatCycle);
  return `
    <div class="modal-body">
      ${mode === 'copy' ? '<div class="ledger-copy-notice">날짜·결제 수단·구매처 등을 복사했어요. 금액과 품목을 고쳐 새 내역으로 추가하세요.</div>' : ''}
      <div class="form-group">
        <label>유형</label>
        ${_renderLedgerTypeToggle(type)}
      </div>
      <div class="form-group">
        <label id="ledgerCatLabel">대분류</label>
        <div id="ledgerCatWrap">${renderLedgerCatSelector(type, cat, 'ledgerCatLabel')}</div>
      </div>
      <div class="form-group">
        <label id="ledgerSubcatLabel">소분류</label>
        <div id="ledgerSubcatWrap">${renderLedgerSubcategoryField(type, cat, subcat)}</div>
      </div>
      <div id="ledgerSpendingTraitsWrap">
        ${renderLedgerSpendingTraits(type, cat, subcat, traits, repeatCycle)}
      </div>
      <div id="ledgerSavingFieldsWrap">
        ${renderLedgerSavingFields(type, cat, item ? isBookSavingIncluded(item) : undefined)}
      </div>
      <div class="form-group ${type === 'saving' ? 'hidden' : ''}" id="ledgerSourceBlock">
        <div class="form-label-with-action"><label for="ledgerSource" id="ledgerSourceLabel">${escHtml(meta.sourceLabel)}</label><button type="button" id="ledgerSourceManagerButton" class="form-label-edit" data-action="toggle-remembered-suggestions" data-kind="${type === 'income' ? 'incomeSources' : 'expenseSources'}">목록 관리</button></div>
        <input type="text" id="ledgerSource" value="${escAttr(source)}" placeholder="${escAttr(meta.sourcePlaceholder)}"
          maxlength="100" ${type === 'expense' ? 'list="expenseSourcePresets"' : type === 'income' ? 'list="incomeSourcePresets"' : ''}>
        <div id="ledgerDatalistWrap">
          ${_renderLedgerSourceDatalist('expense', 'expenseSourcePresets')}
          ${_renderLedgerSourceDatalist('income', 'incomeSourcePresets')}
        </div>
        <div id="ledgerSourceSuggestionManager" class="remembered-suggestion-manager hidden" data-suggestion-kind="${type === 'income' ? 'incomeSources' : 'expenseSources'}">${renderRememberedSuggestionList(type === 'income' ? 'incomeSources' : 'expenseSources')}</div>
      </div>
      ${renderLedgerTransferAccounts(type, fromAccount, toAccount)}
      ${renderLedgerLineItemsBlock(type, lineItems, cat)}
      <div class="form-group ${type === 'expense' && lineItems.length ? 'hidden' : ''}" id="ledgerSingleItemBlock">
        <label for="ledgerItem" id="ledgerItemLabel">${type === 'expense' ? '품목' : type === 'saving' ? '저축 내용' : '수입 내용'}</label>
        <input type="text" id="ledgerItem" value="${escAttr(ledgerItem)}" placeholder="${type === 'expense' ? '예: 우유, 생활용품' : type === 'saving' ? '예: 8월 정기적금' : '예: 8월 급여'}" maxlength="120">
      </div>
      ${renderLedgerDiscountFields(type, amount, discount.original, type === 'expense' && lineItems.length > 0)}
      <div class="form-row">
        <div class="form-group">
          <label for="ledgerAmount" id="ledgerAmountLabel">${type === 'expense' ? '실제 결제액 *' : type === 'saving' ? '저축·이체 금액 *' : '금액 *'}</label>
          <input type="number" inputmode="decimal" id="ledgerAmount" value="${escAttr(amount)}" placeholder="0" min="0" required>
          <div class="amount-hint" id="ledgerAmountHint"></div>
        </div>
        <div class="form-group">
          <label for="ledgerDate">날짜</label>
          <input type="date" id="ledgerDate" value="${escAttr(date)}">
        </div>
      </div>
      <div class="form-group">
        <label for="ledgerMemo">메모</label>
        <input type="text" id="ledgerMemo" value="${escAttr(memo)}" placeholder="필요한 설명이 있을 때만 입력하세요" maxlength="200">
      </div>
      <div class="form-group ${type === 'saving' ? 'hidden' : ''}" id="ledgerPaymentBlock">
        <div class="form-label-with-action">
          <label for="ledgerPayment" id="ledgerPaymentLabel">결제/입금 수단</label>
          <button type="button" class="form-label-edit" data-action="open-book-payment-manager" aria-label="결제·입금 수단 관리" title="결제·입금 수단 관리">✎ 관리</button>
        </div>
        <div id="ledgerPaymentWrap">${renderLedgerPaymentSelector(payment)}</div>
      </div>
      ${renderLedgerRepeatFields(type, repeatCycle, subscription)}
      ${renderLedgerAdvanceFields(type, amount, advance.expected, advance.settled, item?.settledDate || '')}
      ${renderLedgerAttachmentFields(relatedUrl)}
      <div class="modal-actions">
        <button class="btn-s" data-action="close-modal" data-modal="modalMain">취소</button>
        <button class="btn-p" data-action="${mode === 'edit' ? 'do-edit-income' : 'do-add-income'}" ${mode === 'edit' ? `data-id="${escAttr(item.id)}"` : ''}>${mode === 'edit' ? '저장' : mode === 'copy' ? '복사해서 추가' : '추가'}</button>
      </div>
    </div>
  `;
}

function openAddIncome() {
  _modalCleanup.removeAll();
  const container = $('#modalMain');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <div class="modal-header">
        <h3>가계부 내역 추가</h3>
        <button class="modal-close" data-action="close-modal" data-modal="modalMain" aria-label="닫기">✕</button>
      </div>
      ${_buildLedgerModalBody({ mode: 'add' })}
    </div>
  `;
  openModal('modalMain');
  _setupModalMainDelegation(container);
  _setupLedgerFormInteractions(container);
  _setupIncomeAmountHint('ledgerAmount', 'ledgerAmountHint');
  _refreshLedgerAdvanceHint();
  _refreshLedgerDiscountHint();
}

function openCopyIncome(id) {
  const item = appState.income.find(entry => entry.id === id);
  if (!item) return;
  _modalCleanup.removeAll();
  const container = $('#modalMain');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <div class="modal-header">
        <h3>가계부 내역 복사</h3>
        <button class="modal-close" data-action="close-modal" data-modal="modalMain" aria-label="닫기">✕</button>
      </div>
      ${_buildLedgerModalBody({ mode: 'copy', item })}
    </div>`;
  openModal('modalMain');
  _setupModalMainDelegation(container);
  _setupLedgerFormInteractions(container);
  _setupIncomeAmountHint('ledgerAmount', 'ledgerAmountHint');
  _refreshLedgerAdvanceHint();
  _refreshLedgerDiscountHint();
  requestAnimationFrame(() => $('#ledgerAmount')?.focus());
}

function _collectLedgerFormValues() {
  const type = normalizeBookType($('#ledgerType')?.value, 'expense');
  const amount = safeNum($('#ledgerAmount')?.value);
  if (amount <= 0) {
    showToast('금액을 입력하세요 (0보다 큰 값)', 'error');
    return null;
  }
  const map = getBookCategoryMap(type);
  const cat = $('#modalMain .cat-btn.active')?.dataset?.cat || getBookTypeMeta(type).defaultCat;
  const subcat = stripHtml($('#ledgerSubcat')?.value || '', 40);
  const fromAccount = type === 'saving' ? stripHtml($('#ledgerFromAccount')?.value || '', 80) : '';
  const toAccount = type === 'saving' ? stripHtml($('#ledgerToAccount')?.value || '', 80) : '';
  if (type === 'saving' && (!fromAccount || !toAccount)) {
    showToast('출금 계좌와 입금 계좌를 모두 선택해 주세요', 'error');
    return null;
  }
  if (type === 'saving' && fromAccount === toAccount) {
    showToast('출금 계좌와 입금 계좌는 서로 달라야 해요', 'error');
    return null;
  }
  const source = type === 'saving'
    ? `${getBookAccountLabel(fromAccount)} → ${getBookAccountLabel(toAccount)}`
    : ($('#ledgerSource')?.value.trim() || '');
  const rawRelatedUrl = ($('#ledgerRelatedUrl')?.value || '').trim();
  const relatedUrl = sanitizeLedgerUrl(rawRelatedUrl);
  if (rawRelatedUrl && !relatedUrl) {
    showToast('관련 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.', 'error');
    return null;
  }
  const repeatCycle = ['monthly', 'yearly'].includes($('#ledgerRepeatCycle')?.value) ? $('#ledgerRepeatCycle').value : '';
  const advanceEnabled = type === 'expense' && !!$('#ledgerAdvanceEnabled')?.checked;
  const advanceAmount = advanceEnabled ? Math.max(0, safeNum($('#ledgerAdvanceAmount')?.value)) : 0;
  const settledAmount = advanceEnabled ? Math.max(0, safeNum($('#ledgerSettledAmount')?.value)) : 0;
  const discountEnabled = type === 'expense' && !!$('#ledgerDiscountEnabled')?.checked;
  const splitEnabled = type === 'expense' && $('#ledgerSplitEnabled')?.value === 'true';
  const lineItems = splitEnabled ? readLedgerLineItemDrafts() : [];
  if (splitEnabled && lineItems.length < 2) {
    showToast('품목 나누기는 품목을 2개 이상 입력해 주세요', 'error');
    return null;
  }
  if (splitEnabled && lineItems.some(line => !line.name || line.amount <= 0)) {
    showToast('나눈 품목의 이름과 금액을 모두 입력해 주세요', 'error');
    return null;
  }
  const lineItemTotal = lineItems.reduce((sum, line) => sum + line.amount, 0);
  const originalAmount = discountEnabled
    ? (splitEnabled ? lineItemTotal : Math.max(0, safeNum($('#ledgerOriginalAmount')?.value)))
    : 0;
  if (splitEnabled && !discountEnabled && Math.abs(lineItemTotal - amount) >= 0.01) {
    showToast(`품목 합계 ${fmtKRW(lineItemTotal)}와 실제 결제액 ${fmtKRW(amount)}이 같아야 해요`, 'error');
    return null;
  }
  if (advanceAmount > amount) {
    showToast('돌려받을 금액은 결제 금액보다 클 수 없어요', 'error');
    return null;
  }
  if (settledAmount > advanceAmount) {
    showToast('돌려받은 금액은 정산 예정 금액보다 클 수 없어요', 'error');
    return null;
  }
  if (discountEnabled && originalAmount <= amount) {
    showToast('할인 전 금액은 실제 결제액보다 크게 입력해 주세요', 'error');
    return null;
  }
  return {
    type,
    amount,
    cat: map[cat] ? cat : 'other',
    subcat,
    payment: type === 'saving' ? '' : stripHtml($('#ledgerPayment')?.value || '', 40),
    fromAccount,
    toAccount,
    date: $('#ledgerDate')?.value || today(),
    source,
    item: splitEnabled ? '' : ($('#ledgerItem')?.value.trim() || ''),
    memo: $('#ledgerMemo')?.value.trim() || '',
    lineItems,
    recurring: repeatCycle === 'monthly',
    repeatCycle,
    subscription: type === 'expense' && !!$('#ledgerSubscription')?.checked,
    advanceAmount,
    settledAmount,
    settledDate: settledAmount > 0 ? ($('#ledgerSettledDate')?.value || today()) : '',
    originalAmount,
    costType: type === 'expense' ? ($('#ledgerCostType')?.value || '') : '',
    needType: type === 'expense' ? ($('#ledgerNeedType')?.value || '') : '',
    savingIncluded: type === 'saving' && !!$('#ledgerSavingIncluded')?.checked,
    relatedUrl,
    receiptImage: _ledgerAttachmentDraft.imageData,
    receiptImageName: _ledgerAttachmentDraft.imageName,
  };
}

function doAddIncome() {
  const values = _collectLedgerFormValues();
  if (!values) return;

  addIncome(values);
  if (values.source && values.type !== 'saving') addPreset(values.type === 'expense' ? 'expenseSources' : 'incomeSources', values.source);

  closeModal('modalMain');
  showToast(`${getBookTypeMeta(values.type).label} 추가됨`, 'success');
  renderIncome();
}

function doDeleteIncome(id) {
  openConfirmModal('이 가계부 기록을 삭제하시겠습니까?', () => {
    const undo = deleteIncome(id);
    renderIncome();
    if (undo) showUndoToast('가계부 기록 삭제됨', () => { undo(); renderIncome(); });
    else showToast('삭제됨');
  });
}

function openEditIncome(id) {
  const item = appState.income.find(i => i.id === id);
  if (!item) return;

  _modalCleanup.removeAll();
  const container = $('#modalMain');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <div class="modal-header">
        <h3>가계부 내역 수정</h3>
        <button class="modal-close" data-action="close-modal" data-modal="modalMain" aria-label="닫기">✕</button>
      </div>
      ${_buildLedgerModalBody({ mode: 'edit', item })}
    </div>
  `;
  openModal('modalMain');
  _setupModalMainDelegation(container);
  _setupLedgerFormInteractions(container);
  _setupIncomeAmountHint('ledgerAmount', 'ledgerAmountHint');
  _refreshLedgerAdvanceHint();
  _refreshLedgerDiscountHint();
}

function doEditIncome(id) {
  const values = _collectLedgerFormValues();
  if (!values) return;

  updateIncome(id, values);
  if (values.source && values.type !== 'saving') addPreset(values.type === 'expense' ? 'expenseSources' : 'incomeSources', values.source);

  closeModal('modalMain');
  showToast(`${getBookTypeMeta(values.type).label} 수정됨`, 'success');
  renderIncome();
}

function getRecurringImportCandidates(year, month) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const monthly = getMonthIncome(prevYear, prevMonth).filter(i => getBookRepeatCycle(i) === 'monthly');
  const yearly = getMonthIncome(year - 1, month).filter(i => getBookRepeatCycle(i) === 'yearly');
  const recurring = [...monthly, ...yearly];
  const current = getMonthIncome(year, month);
  return recurring.filter(r => {
    const rType = getBookType(r);
    return !current.some(i => getBookType(i) === rType && i.cat === r.cat
      && getBookSubcategoryLabel(i) === getBookSubcategoryLabel(r)
      && i.payment === r.payment && i.source === r.source
      && Math.abs(safeNum(i.amount) - safeNum(r.amount)) < 1);
  });
}

function copyRecurring(year, month) {
  const candidates = getRecurringImportCandidates(year, month);
  if (candidates.length === 0) { showToast('가져올 반복 내역이 없거나 이미 모두 등록되어 있어요', 'info'); return; }
  const container = $('#modalSub');
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const lastDay = String(new Date(year, month, 0).getDate()).padStart(2, '0');
  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box modal-large">
    <div class="modal-header"><h3>${year}년 ${month}월 반복 내역 선택</h3><button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button></div>
    <div class="modal-body recurring-import-modal">
      <div class="recurring-import-head">
        <p>가져올 내역만 체크하세요. 이번 달에 이미 같은 내역이 있으면 목록에서 제외돼요.</p>
        <div><button type="button" class="btn-sm" data-action="select-all-recurring">전체 선택</button><button type="button" class="btn-sm" data-action="clear-all-recurring">전체 해제</button></div>
      </div>
      <div class="recurring-import-list" role="group" aria-label="가져올 반복 내역">
        ${candidates.map(item => {
          const type = getBookType(item);
          const meta = getBookTypeMeta(type);
          const cat = getBookCategory(item);
          const subcat = getBookSubcategoryLabel(item);
          const name = String(item.item || item.source || cat.label).trim();
          const day = Number((item.date || '').split('-')[2]) || 1;
          const targetDay = clampDay(year, month, day);
          const targetDate = `${monthKey}-${String(targetDay).padStart(2, '0')}`;
          return `<div class="recurring-import-item" data-id="${escAttr(item.id)}">
            <input type="checkbox" class="recurring-import-check" value="${escAttr(item.id)}" checked aria-label="${escAttr(name)} 가져오기">
            <span class="income-cat-icon ${type}" style="--book-cat-color:${escAttr(getBookCategoryColor(type, item.cat))}" aria-hidden="true">${cat.icon}</span>
            <span class="recurring-import-text"><strong>${escHtml(name)}</strong><small>${escHtml(meta.label)} · ${escHtml(cat.label)}${subcat ? ` · ${escHtml(subcat)}` : ''}${item.payment ? ` · ${escHtml(item.payment)}` : ''}</small></span>
            <div class="recurring-import-edit"><label><span>날짜</span><input class="recurring-import-date" type="date" value="${escAttr(targetDate)}" min="${monthKey}-01" max="${monthKey}-${lastDay}"></label><label><span>금액</span><input class="recurring-import-amount" type="number" inputmode="decimal" min="1" value="${escAttr(item.amount)}"></label></div>
          </div>`;
        }).join('')}
      </div>
      <div class="recurring-import-count" id="recurringImportCount">${candidates.length}건 선택됨</div>
      <div class="modal-actions"><button class="btn-s" data-action="close-sub-modal">취소</button><button class="btn-p" data-action="confirm-recurring-import" data-year="${year}" data-month="${month}">선택한 내역 가져오기</button></div>
    </div></div>`;
  openModal('modalSub');
  const refreshCount = () => {
    const count = $$('.recurring-import-check:checked', container).length;
    const label = $('#recurringImportCount', container);
    if (label) label.textContent = `${count}건 선택됨`;
    const confirm = $('[data-action="confirm-recurring-import"]', container);
    if (confirm) confirm.disabled = count === 0;
  };
  _setupModalSubDelegation(container, (action, target) => {
    if (action === 'select-all-recurring' || action === 'clear-all-recurring') {
      const checked = action === 'select-all-recurring';
      $$('.recurring-import-check', container).forEach(input => { input.checked = checked; });
      refreshCount();
    } else if (action === 'confirm-recurring-import') {
      const drafts = $$('.recurring-import-item', container).filter(row => $('.recurring-import-check', row)?.checked).map(row => ({
        id: row.dataset.id,
        date: $('.recurring-import-date', row)?.value || '',
        amount: Math.max(0, safeNum($('.recurring-import-amount', row)?.value)),
      }));
      confirmRecurringImport(Number(target.dataset.year), Number(target.dataset.month), drafts);
    }
  });
  _modalCleanup.add(container, 'change', event => {
    if (event.target?.classList?.contains('recurring-import-check')) refreshCount();
  });
}

function confirmRecurringImport(year, month, drafts) {
  const draftMap = new Map((drafts || []).map(draft => [String(draft.id), draft]));
  const recurring = getRecurringImportCandidates(year, month).filter(item => draftMap.has(String(item.id)));
  if (!recurring.length) { showToast('가져올 내역을 하나 이상 선택해 주세요', 'info'); return; }
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  if (recurring.some(item => {
    const draft = draftMap.get(String(item.id));
    return !draft || !isValidDate(draft.date) || !draft.date.startsWith(monthPrefix) || draft.amount <= 0;
  })) { showToast('선택한 내역의 날짜와 금액을 확인해 주세요', 'error'); return; }
  let count = 0;
  for (const r of recurring) {
    const draft = draftMap.get(String(r.id));
    const rType = getBookType(r);
    const exists = getMonthIncome(year, month).find(
      i => getBookType(i) === rType && i.cat === r.cat && getBookSubcategoryLabel(i) === getBookSubcategoryLabel(r)
        && i.payment === r.payment && i.source === r.source && Math.abs(safeNum(i.amount) - draft.amount) < 1
    );
    if (!exists) {
      addIncome({
        ...r,
        type: rType,
        date: draft.date,
        amount: draft.amount,
        id: undefined,
        settledAmount: 0,
        settledDate: '',
      });
      count++;
    }
  }
  closeModal('modalSub');
  showToast(count > 0 ? `${count}건 가져왔어요` : '이미 모두 가져온 내역이에요', count > 0 ? 'success' : 'info');
  renderIncome();
}

function openBookMonthPicker() {
  const [currentYear, currentMonth] = UIState.incomeMonth.split('-').map(Number);
  const container = $('#modalSub');
  container.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box modal-box-sm book-month-modal">
      <div class="modal-header">
        <h3>날짜 이동</h3>
        <button class="modal-close" data-action="close-sub-modal" aria-label="닫기">✕</button>
      </div>
      <div class="modal-body">
        <label class="book-month-year-label" for="bookMonthYear">이동할 연도</label>
        <input class="input book-month-year-input" type="number" id="bookMonthYear" value="${currentYear}" min="1900" max="2200" inputmode="numeric">
        <div class="book-month-grid" role="group" aria-label="이동할 월">
          ${Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const selected = month === currentMonth ? ' is-selected' : '';
            return `<button type="button" class="book-month-option${selected}" data-action="select-book-month" data-month="${month}">${month}월</button>`;
          }).join('')}
        </div>
        <p class="book-month-help">연도를 입력한 뒤 원하는 월을 누르면 바로 이동해요.</p>
      </div>
    </div>`;
  openModal('modalSub');
  _setupModalSubDelegation(container, (action, target) => {
    if (action !== 'select-book-month') return;
    const year = Number($('#bookMonthYear', container)?.value);
    const month = Number(target.dataset.month);
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      showToast('연도는 1900년부터 2200년 사이로 입력해 주세요', 'error');
      return;
    }
    UIState.incomeMonth = `${year}-${String(month).padStart(2, '0')}`;
    closeModal('modalSub');
    renderIncome();
  });
  setTimeout(() => $('#bookMonthYear', container)?.select(), 50);
}

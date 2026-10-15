/* =============================================
   Optional Supabase cloud synchronization
   Local IndexedDB remains the primary offline store.
   ============================================= */

const CLOUD_TABLE = 'user_data';
const CLOUD_SYNC_DELAY_MS = 1800;
const CLOUD_PULL_DEDUP_MS = 30000;

let _cloudClient = null;
let _cloudUser = null;
let _cloudState = 'unconfigured';
let _cloudLastSync = '';
let _cloudLastError = '';
let _cloudSaveTimer = null;
let _cloudSyncInFlight = null;
let _cloudApplying = false;
let _cloudLastPullMs = 0;

function isCloudConfigured() {
  return typeof SUPABASE_URL === 'string'
    && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL.trim())
    && typeof SUPABASE_PUBLISHABLE_KEY === 'string'
    && SUPABASE_PUBLISHABLE_KEY.trim().length > 20;
}

function getCloudStatus() {
  return {
    configured: isCloudConfigured(),
    signedIn: !!_cloudUser,
    email: _cloudUser?.email || '',
    state: _cloudState,
    lastSync: _cloudLastSync,
    error: _cloudLastError,
  };
}

function _setCloudState(state, error = '') {
  _cloudState = state;
  _cloudLastError = error ? String(error.message || error) : '';
  EventBus.emit('cloudStatusChanged', getCloudStatus());
}

async function initCloudSync() {
  if (!isCloudConfigured()) {
    _setCloudState('unconfigured');
    return false;
  }
  if (!globalThis.supabase?.createClient) {
    _setCloudState('error', 'Supabase 라이브러리를 불러오지 못했습니다');
    return false;
  }

  try {
    _cloudClient = globalThis.supabase.createClient(
      SUPABASE_URL.trim(),
      SUPABASE_PUBLISHABLE_KEY.trim(),
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
    const { data, error } = await _cloudClient.auth.getSession();
    if (error) throw error;
    _cloudUser = data.session?.user || null;
    _setCloudState(_cloudUser ? 'ready' : 'signed-out');

    _cloudClient.auth.onAuthStateChange((event, session) => {
      _cloudUser = session?.user || null;
      _setCloudState(_cloudUser ? 'ready' : 'signed-out');
      if (event === 'SIGNED_IN' && _cloudUser) {
        setTimeout(() => syncCloudNow({ reason: 'sign-in' }), 0);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && _cloudUser
          && Date.now() - _cloudLastPullMs > CLOUD_PULL_DEDUP_MS) {
        syncCloudNow({ reason: 'resume', quiet: true });
      }
    });
    return true;
  } catch (e) {
    console.error('initCloudSync failed:', e);
    _setCloudState('error', e);
    return false;
  }
}

async function syncCloudOnAppStart() {
  if (!_cloudClient || !_cloudUser) return false;
  return syncCloudNow({ reason: 'app-start', quiet: true });
}

async function _readPortfolioState(pid) {
  if (pid === activePortfolioId) return JSON.parse(JSON.stringify(appState));
  const key = getStorageKey(pid);
  let raw = null;
  if (_canUseIndexedDB()) raw = await _idbGet(key);
  if (!raw) raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : defaultState();
}

async function _buildCloudBundle() {
  const meta = loadPortfolioMeta();
  const portfolios = {};
  let latestSaved = '';
  for (const item of meta.list || []) {
    if (!item?.id) continue;
    const state = await _readPortfolioState(item.id);
    portfolios[item.id] = state;
    if (state?.saved && state.saved > latestSaved) latestSaved = state.saved;
  }
  if (!portfolios.default && activePortfolioId === 'default') {
    portfolios.default = JSON.parse(JSON.stringify(appState));
    if (appState.saved && appState.saved > latestSaved) latestSaved = appState.saved;
  }
  return {
    schemaVersion: 1,
    savedAt: latestSaved || '1970-01-01T00:00:00.000Z',
    activePortfolioId,
    portfolioMeta: meta,
    portfolios,
  };
}

function _validateCloudBundle(bundle) {
  if (!bundle || bundle.schemaVersion !== 1 || !bundle.portfolios
      || typeof bundle.portfolios !== 'object') {
    throw new Error('클라우드 데이터 형식이 올바르지 않습니다');
  }
  const entries = Object.entries(bundle.portfolios);
  if (entries.length === 0 || entries.length > LIMITS.portfolios) {
    throw new Error('클라우드 포트폴리오 수가 올바르지 않습니다');
  }
  for (const [pid, state] of entries) {
    if (!pid || !state || typeof state !== 'object' || !Array.isArray(state.assets)) {
      throw new Error('클라우드 포트폴리오 데이터가 손상되었습니다');
    }
  }
  return true;
}

async function _applyCloudBundle(bundle) {
  _validateCloudBundle(bundle);
  _cloudApplying = true;
  try {
    for (const [pid, state] of Object.entries(bundle.portfolios)) {
      const raw = JSON.stringify(state);
      const key = getStorageKey(pid);
      if (_canUseIndexedDB()) {
        await _idbSet(key, raw);
        try { localStorage.removeItem(key); } catch (_) {}
      } else {
        localStorage.setItem(key, raw);
      }
    }

    const sourceMeta = bundle.portfolioMeta || {};
    const list = Array.isArray(sourceMeta.list)
      ? sourceMeta.list
          .filter(item => item?.id && bundle.portfolios[item.id])
          .slice(0, LIMITS.portfolios)
          .map(item => ({ id: String(item.id), name: stripHtml(item.name || '포트폴리오', 50) }))
      : [];
    if (list.length === 0) list.push({ id: 'default', name: '기본 포트폴리오' });
    const requestedActive = String(bundle.activePortfolioId || sourceMeta.active || 'default');
    const nextActive = list.some(item => item.id === requestedActive) ? requestedActive : list[0].id;
    savePortfolioMeta({ active: nextActive, list });
    activePortfolioId = nextActive;
    await loadData();
    EventBus.emit('dataImported');
    if (typeof render === 'function') render();
  } finally {
    _cloudApplying = false;
  }
}

async function _fetchCloudRow() {
  const { data, error } = await _cloudClient
    .from(CLOUD_TABLE)
    .select('payload, updated_at')
    .eq('user_id', _cloudUser.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function _uploadCloudBundle(bundle = null) {
  if (!_cloudClient || !_cloudUser || _cloudApplying) return false;
  const payload = bundle || await _buildCloudBundle();
  _validateCloudBundle(payload);
  const { error } = await _cloudClient.from(CLOUD_TABLE).upsert({
    user_id: _cloudUser.id,
    payload,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
  _cloudLastSync = new Date().toISOString();
  _setCloudState('synced');
  return true;
}

async function syncCloudNow(options = {}) {
  if (!_cloudClient || !_cloudUser) return false;
  if (_cloudSyncInFlight) return _cloudSyncInFlight;
  _cloudSyncInFlight = (async () => {
    _setCloudState('syncing');
    try {
      const local = await _buildCloudBundle();
      const remote = await _fetchCloudRow();
      _cloudLastPullMs = Date.now();

      if (!remote?.payload) {
        await _uploadCloudBundle(local);
        if (!options.quiet) showToast('현재 데이터를 클라우드에 안전하게 저장했습니다', 'success');
        return true;
      }

      _validateCloudBundle(remote.payload);
      const localMs = Date.parse(local.savedAt || 0) || 0;
      const remoteMs = Date.parse(remote.payload.savedAt || remote.updated_at || 0) || 0;
      if (remoteMs > localMs) {
        await _applyCloudBundle(remote.payload);
        _cloudLastSync = new Date().toISOString();
        _setCloudState('synced');
        if (!options.quiet) showToast('다른 PC의 최신 데이터를 불러왔습니다', 'success');
      } else if (localMs > remoteMs) {
        await _uploadCloudBundle(local);
        if (!options.quiet) showToast('이 PC의 최신 데이터를 클라우드에 저장했습니다', 'success');
      } else {
        _cloudLastSync = new Date().toISOString();
        _setCloudState('synced');
        if (!options.quiet) showToast('클라우드 데이터가 최신 상태입니다', 'success');
      }
      return true;
    } catch (e) {
      console.error('Cloud sync failed:', e);
      _setCloudState('error', e);
      if (!options.quiet) showToast(`클라우드 동기화 실패: ${e.message || e}`, 'error');
      return false;
    } finally {
      _cloudSyncInFlight = null;
    }
  })();
  return _cloudSyncInFlight;
}

function queueCloudSync() {
  if (_cloudApplying || !_cloudClient || !_cloudUser) return;
  clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(() => {
    _cloudSaveTimer = null;
    _uploadCloudBundle().catch(e => {
      console.error('Queued cloud sync failed:', e);
      _setCloudState('error', e);
    });
  }, CLOUD_SYNC_DELAY_MS);
}

async function cloudSignIn(email, password) {
  if (!_cloudClient) throw new Error('Supabase 설정이 아직 완료되지 않았습니다');
  const { data, error } = await _cloudClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  _cloudUser = data.user;
  _setCloudState('ready');
  await syncCloudNow({ reason: 'sign-in' });
  return data.user;
}

async function cloudSignUp(email, password) {
  if (!_cloudClient) throw new Error('Supabase 설정이 아직 완료되지 않았습니다');
  const { data, error } = await _cloudClient.auth.signUp({ email, password });
  if (error) throw error;
  _cloudUser = data.session?.user || null;
  _setCloudState(_cloudUser ? 'ready' : 'signed-out');
  return data;
}

async function cloudSignOut() {
  if (!_cloudClient) return;
  const { error } = await _cloudClient.auth.signOut();
  if (error) throw error;
  _cloudUser = null;
  _setCloudState('signed-out');
}

function _cloudStatusLabel() {
  const status = getCloudStatus();
  if (!status.configured) return '설정 필요';
  if (!status.signedIn) return '로그인 필요';
  if (status.state === 'syncing') return '동기화 중';
  if (status.state === 'error') return '연결 오류';
  return '연결됨';
}

function renderCloudSyncCard() {
  const status = getCloudStatus();
  const ok = status.signedIn && status.state !== 'error';
  const last = status.lastSync ? `${status.lastSync.slice(0, 10)} ${status.lastSync.slice(11, 16)}` : '';
  return `<div class="card stagger-item cloud-sync-card" style="--i:1" role="region" aria-label="클라우드 동기화">
    <div class="card-title">☁️ 집·학교 자동 동기화</div>
    <p class="cloud-sync-copy">로컬 백업은 유지하면서 로그인한 PC끼리 같은 가계부를 사용합니다.</p>
    <div class="storage-meta">
      <span class="storage-pill ${ok ? 'storage-pill-ok' : ''}">${escHtml(_cloudStatusLabel())}</span>
      ${status.email ? `<span class="storage-pill">${escHtml(status.email)}</span>` : ''}
      ${last ? `<span class="storage-pill">최근 동기화: ${escHtml(last)}</span>` : ''}
    </div>
    <button class="btn-p cloud-sync-button" data-action="open-cloud-sync">클라우드 설정</button>
  </div>`;
}

function openCloudSyncModal() {
  const container = $('#modalMain');
  if (!container) return;
  const status = getCloudStatus();
  let body = '';
  if (!status.configured) {
    body = `<div class="cloud-notice">Supabase 프로젝트 연결 준비가 아직 끝나지 않았습니다.<br>프로젝트 URL과 publishable key를 설정하면 로그인이 활성화됩니다.</div>`;
  } else if (!status.signedIn) {
    body = `<div class="form-group"><label for="cloudEmail">이메일</label>
        <input type="email" id="cloudEmail" autocomplete="username" placeholder="example@email.com"></div>
      <div class="form-group"><label for="cloudPassword">비밀번호</label>
        <input type="password" id="cloudPassword" autocomplete="current-password" minlength="8" placeholder="8자 이상"></div>
      <p class="form-help">집과 학교에서 같은 이메일 계정으로 로그인하세요.</p>
      <div class="modal-actions"><button class="btn-s" data-cloud-action="signup">처음 가입</button>
        <button class="btn-p" data-cloud-action="signin">로그인</button></div>`;
  } else {
    body = `<div class="cloud-notice cloud-notice-ok"><strong>${escHtml(status.email)}</strong> 계정으로 연결되어 있습니다.</div>
      ${status.error ? `<p class="form-help text-danger">${escHtml(status.error)}</p>` : ''}
      <div class="modal-actions"><button class="btn-s" data-cloud-action="signout">로그아웃</button>
        <button class="btn-p" data-cloud-action="sync">지금 동기화</button></div>`;
  }

  container.innerHTML = `<div class="modal-backdrop"></div><div class="modal-box">
    <div class="modal-header"><h3>클라우드 동기화</h3>
      <button class="modal-close" data-cloud-action="close" aria-label="닫기">✕</button></div>
    <div class="modal-body">${body}</div></div>`;
  openModal('modalMain');
  container.onclick = async (e) => {
    const target = e.target.closest('[data-cloud-action]');
    if (!target) return;
    const action = target.dataset.cloudAction;
    if (action === 'close') { closeModal('modalMain'); return; }
    target.disabled = true;
    try {
      if (action === 'signin' || action === 'signup') {
        const email = $('#cloudEmail')?.value.trim();
        const password = $('#cloudPassword')?.value || '';
        if (!email || password.length < 8) throw new Error('이메일과 8자 이상의 비밀번호를 입력하세요');
        if (action === 'signin') {
          await cloudSignIn(email, password);
          showToast('로그인하고 데이터를 동기화했습니다', 'success');
        } else {
          const result = await cloudSignUp(email, password);
          showToast(result.session ? '가입하고 데이터를 연결했습니다' : '가입 확인 이메일을 확인하세요', 'success');
        }
      } else if (action === 'sync') {
        await syncCloudNow({ reason: 'manual' });
      } else if (action === 'signout') {
        await cloudSignOut();
        showToast('클라우드에서 로그아웃했습니다. 로컬 데이터는 유지됩니다', 'info');
      }
      closeModal('modalMain');
      renderHistory();
    } catch (err) {
      showToast(err.message || String(err), 'error');
      target.disabled = false;
    }
  };
}



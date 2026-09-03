/* Lightweight Supabase sync for the static/PWA build. Uses only the public
   publishable key; row-level security must be enabled with sync-schema.sql. */
(() => {
  const SUPABASE_URL = 'https://gwnspmiwlxiasnrkzdgi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_JZnnVcugDkVM5I9nYUyl4A_07qyC3vJ';
  const AUTH_KEY = 'work-calendar-pro-supabase-session';
  const DATA_KEYS = [
    'schedule-ledger-v1','schedule-ledger-tags-v1','schedule-ledger-clients-v1',
    'schedule-ledger-trash-v1','schedule-ledger-other-income-v1',
    'schedule-ledger-income-targets-v1','schedule-ledger-templates-v1'
  ];
  const notify = message => window.showToast?.(message) || window.alert(message);
  const session = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch { return null; } };
  const headers = (token = '') => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}`, 'Content-Type': 'application/json' });
  function snapshot() {
    const data = {}; DATA_KEYS.forEach(key => { const value = localStorage.getItem(key); if (value !== null) data[key] = value; });
    return data;
  }
  function restore(data) { Object.entries(data || {}).forEach(([key, value]) => localStorage.setItem(key, value)); window.location.reload(); }
  async function auth(path, body) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    const json = await response.json(); if (!response.ok) throw new Error(json.error_description || json.msg || json.message || '登录失败'); return json;
  }
  async function login(email, password) {
    const result = await auth('token?grant_type=password', { email, password });
    localStorage.setItem(AUTH_KEY, JSON.stringify(result)); return result;
  }
  async function signup(email, password) { return auth('signup', { email, password, options: { email_redirect_to: `${window.location.origin}${window.location.pathname}` } }); }
  async function sync() {
    const current = session(); if (!current?.access_token || !current.user?.id) throw new Error('请先登录');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/work_calendar_sync?user_id=eq.${encodeURIComponent(current.user.id)}&select=payload,updated_at`, { headers: headers(current.access_token) });
    if (!response.ok) throw new Error('读取云端数据失败');
    const rows = await response.json(); const local = snapshot();
    if (rows[0]?.payload && Object.keys(local).length && !window.confirm('云端已有数据，是否用云端数据覆盖本机数据？取消则把本机数据上传到云端。')) {
      await upload(local, current); notify('本机数据已同步到云端'); return;
    }
    if (rows[0]?.payload) { restore(rows[0].payload); return; }
    await upload(local, current); notify('数据已首次同步到云端');
  }
  async function upload(payload, current = session()) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/work_calendar_sync`, { method: 'POST', headers: { ...headers(current.access_token), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: current.user.id, payload }) });
    if (!response.ok) throw new Error('上传云端失败');
  }
  function mount() {
    const nav = document.querySelector('.drawer-nav'); if (!nav || document.getElementById('cloudSyncButton')) return;
    const button = document.createElement('button'); button.id = 'cloudSyncButton'; button.type = 'button'; button.innerHTML = '<span>↻</span><div><b>云端同步</b><small>电脑与手机保持一致</small></div>';
    button.addEventListener('click', async () => {
      try {
        let current = session();
        if (!current?.access_token) {
          const credentials = await credentialDialog(); if (!credentials) return;
          try { current = credentials.mode === 'signup' ? await signup(credentials.email, credentials.password) : await login(credentials.email, credentials.password); }
          catch (error) { notify(error.message); return; }
          if (!current.access_token) { notify('注册成功，请查收验证邮件；验证后再点击云端同步'); return; }
          localStorage.setItem(AUTH_KEY, JSON.stringify(current));
        }
        await sync();
      } catch (error) { notify(error.message); }
    }); nav.appendChild(button);
  }
  function credentialDialog() {
    return new Promise(resolve => {
      const overlay = document.createElement('div'); overlay.className = 'cloud-auth-overlay';
      overlay.innerHTML = '<section class="cloud-auth-card"><button class="cloud-auth-close" aria-label="关闭">×</button><div class="cloud-auth-icon">↻</div><h2>同步你的工作日历</h2><p>登录后可在电脑与 iPhone 间同步日程、客户和收入。</p><label>邮箱<input type="email" autocomplete="email" placeholder="you@example.com"></label><label>密码<input type="password" autocomplete="current-password" placeholder="至少 6 位"></label><div class="cloud-auth-error"></div><button class="button primary cloud-auth-submit">登录并同步</button><button class="cloud-auth-switch" type="button">还没有账号？注册</button></section>';
      document.body.appendChild(overlay); const card = overlay.querySelector('.cloud-auth-card'); const email = card.querySelector('input[type=email]'); const password = card.querySelector('input[type=password]'); const submit = card.querySelector('.cloud-auth-submit'); const error = card.querySelector('.cloud-auth-error'); const close = () => { overlay.remove(); resolve(null); }; let mode = 'login';
      overlay.querySelector('.cloud-auth-close').onclick = close; overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
      overlay.querySelector('.cloud-auth-switch').onclick = event => { mode = mode === 'login' ? 'signup' : 'login'; event.target.textContent = mode === 'login' ? '还没有账号？注册' : '已有账号？返回登录'; submit.textContent = mode === 'login' ? '登录并同步' : '注册账号'; };
      submit.onclick = () => { if (!email.value || password.value.length < 6) { error.textContent = '请输入有效邮箱和至少 6 位密码'; return; } overlay.remove(); resolve({ mode, email: email.value.trim(), password: password.value }); };
      email.focus();
    });
  }
  window.cloudSync = { login, signup, sync, snapshot, restore };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

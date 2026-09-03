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
  async function signup(email, password) { return auth('signup', { email, password }); }
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
          const email = prompt('请输入同步账号邮箱'); if (!email) return;
          const password = prompt('请输入密码（不会保存明文）'); if (!password) return;
          try { current = await login(email, password); }
          catch (error) {
            if (!window.confirm('登录失败，是否用此邮箱注册新账号？')) throw error;
            const created = await signup(email, password);
            if (!created.access_token) { notify('注册成功，请查收验证邮件后再点击同步'); return; }
            localStorage.setItem(AUTH_KEY, JSON.stringify(created)); current = created;
          }
        }
        await sync();
      } catch (error) { notify(error.message); }
    }); nav.appendChild(button);
  }
  window.cloudSync = { login, signup, sync, snapshot, restore };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

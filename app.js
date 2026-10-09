'use strict';
// Гардероб. Оболочка публичная, данные — в закрытом репозитории mary-jetmetrics/wardrobe-data,
// доступ по ключу (fine-grained token), который вводится один раз на устройстве.
// Сам каталог — catalog.js (тот же код, что у локального каталога, собирается build_web.py).
(() => {
const OWNER = 'mary-jetmetrics', REPO = 'wardrobe-data', BRANCH = 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без хранилища — войдёт заново */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* нечего удалять */ } },
};
// Ключ «Поездок» (тот же адрес mary-jetmetrics.github.io) подходит, если ему дан доступ к wardrobe-data — тогда входить не нужно
let TOKEN = LS.get('wardrobe-token') || LS.get('trips-token');
let OWN = !!LS.get('wardrobe-token');
window.__WEB = true;
const gate = document.getElementById('gate');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- GitHub ---------- */
async function raw(file) {
  const r = await fetch(`${API}/contents/${file.split('/').map(encodeURIComponent).join('/')}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (!r.ok) { const e = new Error('GitHub ответил ' + r.status); e.status = r.status; throw e; }
  return r;
}

/* ---------- фото: по мере прокрутки, не больше 6 разом, с кешем на устройстве ---------- */
const CACHE = 'wardrobe-photos-1', URLS = {}, queue = [];
let active = 0;
async function photoURL(file, v) {
  const key = `${file}?v=${v}`;
  if (URLS[key]) return URLS[key];
  const req = new Request(`${location.origin}/__photos/${file}?v=${encodeURIComponent(v)}`);
  let blob = null, cache = null;
  try { cache = await caches.open(CACHE); const hit = await cache.match(req); if (hit) blob = await hit.blob(); } catch (e) { /* без кеша — просто скачаем */ }
  if (!blob) {
    blob = await (await raw(file)).blob();
    if (cache) cache.put(req, new Response(blob, { headers: { 'Content-Type': 'image/jpeg' } })).catch(() => {});
  }
  return (URLS[key] = URL.createObjectURL(blob));
}
function pump() {
  while (active < 6 && queue.length) {
    const img = queue.shift(); active++;
    photoURL(img.dataset.file, img.dataset.v).then(u => { img.src = u; }).catch(() => { img.alt = 'Фото не загрузилось'; })
      .finally(() => { active--; pump(); });
  }
}
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); queue.push(e.target); pump(); } }), { rootMargin: '800px' })
  : null;
window.__loadPhotos = rootEl => rootEl.querySelectorAll('img[data-file]').forEach(img => {
  const ready = URLS[`${img.dataset.file}?v=${img.dataset.v}`];
  if (ready) { img.src = ready; return; }
  if (io) io.observe(img); else { queue.push(img); pump(); }
});

/* ---------- вход и загрузка ---------- */
function showGate(msg) {
  gate.innerHTML = `<h1 class="title">Мой гардероб</h1>
  <form id="login" class="gate-form">
    <p>Вставь ключ доступа — один раз на этом устройстве. Ключ хранится только здесь, в браузере.</p>
    ${msg ? `<p class="gate-err">${esc(msg)}</p>` : ''}
    <label class="cap" for="tok">Ключ (начинается с github_pat_)</label>
    <input id="tok" class="search" autocomplete="off" spellcheck="false" placeholder="github_pat_…">
    <button class="gate-btn" type="submit">Войти</button>
  </form>`;
  document.getElementById('login').addEventListener('submit', e => {
    e.preventDefault();
    const v = document.getElementById('tok').value.trim(); if (!v) return;
    TOKEN = v; OWN = true; LS.set('wardrobe-token', v); boot();
  });
}
async function boot() {
  if (!TOKEN) return showGate();
  gate.innerHTML = '<p class="cap">Загружаю гардероб…</p>';
  try {
    window.__ITEMS = await (await raw('items.json')).json();
  } catch (e) {
    if ([401, 403, 404].includes(e.status)) {
      if (OWN) { LS.del('wardrobe-token'); TOKEN = null; return showGate('Ключ не подошёл. Проверь, что у него есть доступ к репозиторию wardrobe-data и он не просрочен.'); }
      TOKEN = null; return showGate(); // ключ «Поездок» без доступа к гардеробу — его не трогаем
    }
    gate.innerHTML = `<p class="cap">Не получилось загрузить гардероб: ${esc(e.message)}. Проверь интернет и обнови страницу.</p>`; return;
  }
  gate.remove();
  document.querySelector('main.page').hidden = false;
  const s = document.createElement('script'); s.src = 'catalog.js?v=' + (window.__BUILD || ''); document.body.appendChild(s);
}
boot();
})();

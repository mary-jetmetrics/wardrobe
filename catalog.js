'use strict';
const ITEMS = window.__ITEMS;
const CAT_ORDER = ['Верх', 'Низ', 'Платья', 'Верхняя одежда', 'Спорт', 'Купальники', 'Обувь', 'Аксессуары', 'Бельё'];
const SW = { 'Белый': '#f7f6f2', 'Молочный': '#f2ece0', 'Бежевый': '#e7d9c4', 'Жёлтый': '#f8e7a0', 'Розовый': '#f4c9d4', 'Красный': '#df6b63', 'Голубой': '#c7e2f3', 'Синий': '#8fa9d4', 'Зелёный': '#bfdcb4', 'Оливковый': '#c4c294', 'Коричневый': '#a98a73', 'Серый': '#cfcfcf', 'Чёрный': '#3a3535', 'Фиолетовый': '#cdbde9', 'Сиреневый': '#d9cdee', 'Бирюзовый': '#b6e2db', 'Серебристый': '#dedede', 'Цветной': '#e9d7f0', 'Bone': '#e8e2d6', 'Светло-коричневый': '#cbb096', 'Разные': '#e6e4e2' };
const COLOR_GROUPS = [
  { name: 'Белые и молочные', sw: '#f5f1e8', colors: ['Белый', 'Молочный'] },
  { name: 'Бежевые', sw: '#e7d9c4', colors: ['Бежевый', 'Bone', 'Светло-коричневый'] },
  { name: 'Коричневые', sw: '#a98a73', colors: ['Коричневый'] },
  { name: 'Серые', sw: '#cfcfcf', colors: ['Серый', 'Серебристый'] },
  { name: 'Чёрные', sw: '#3a3535', colors: ['Чёрный'] },
  { name: 'Розовые', sw: '#f4c9d4', colors: ['Розовый'] },
  { name: 'Красные', sw: '#df6b63', colors: ['Красный'] },
  { name: 'Жёлтые', sw: '#f8e7a0', colors: ['Жёлтый'] },
  { name: 'Зелёные', sw: '#bfdcb4', colors: ['Зелёный', 'Оливковый'] },
  { name: 'Голубые', sw: '#c7e2f3', colors: ['Голубой', 'Синий', 'Бирюзовый'] },
  { name: 'Фиолетовые', sw: '#d4c5ec', colors: ['Фиолетовый', 'Сиреневый'] },
  { name: 'Разноцветные', sw: 'linear-gradient(135deg, #f4c9d4, #f8e7a0, #c7e2f3)', colors: ['Разные', 'Цветной'] },
];
const colorGroup = (c) => COLOR_GROUPS.find(g => g.colors.some(x => (c || '').startsWith(x)));
const swatch = (c) => { const k = Object.keys(SW).sort((a, b) => b.length - a.length).find(x => (c || '').startsWith(x)); return k ? SW[k] : '#e6e4e2'; };
const esc = (s) => String(s || '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '$1').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
const st = { cat: null, sub: null, kind: null, colors: [], brands: [], shop: '', q: '', photo: '', link: '', status: '', core: '', fav: '', sort: 'no' };
try { Object.assign(st, JSON.parse(localStorage.getItem('wardrobe-filters') || '{}')); } catch (e) {}
if (typeof st.photo !== 'string') st.photo = st.photo ? 'yes' : '';
if ('brand' in st) { if (st.brand) st.brands = [String(st.brand).toLowerCase()]; delete st.brand; }
if (!Array.isArray(st.brands)) st.brands = [];
const bkey = (b) => (b || '').trim().toLowerCase();
// Бренд с одной вещью, «Ноунейм» и вещи без бренда — в фильтре одной строкой «Другие» (Мария, 09.10.26);
// вторая вещь бренда — и он сам появится отдельной строкой. В базе и названии бренд остаётся настоящий.
const OTHER = 'другие';
const BCOUNT = ITEMS.reduce((m, i) => { const k = bkey(i.brand); if (k) m[k] = (m[k] || 0) + 1; return m; }, {});
const bgroup = (b) => { const k = bkey(b); return (!k || k === 'ноунейм' || (BCOUNT[k] || 0) < 2) ? OTHER : k; };
// Бренд, записанный в базе по-разному (SELA / Sela), — одна строка; показываем самое частое написание
const BRANDS = (() => { const m = new Map(); for (const i of ITEMS) { const k = bgroup(i.brand); if (k === OTHER) continue; const e = m.get(k) || {}; e[i.brand] = (e[i.brand] || 0) + 1; m.set(k, e); }
  return [...[...m].map(([k, e]) => ({ k, name: Object.entries(e).sort((a, b) => b[1] - a[1])[0][0] })).sort((a, b) => a.name.localeCompare(b.name, 'ru')), { k: OTHER, name: 'Другие' }]; })();
let brandQ = '';
delete st.transit;
// цвет — множественный выбор (Мария, 09.10.26); фильтры фасона убраны — его покрывают категории
if (st.color) st.colors = [st.color];
if (!Array.isArray(st.colors)) st.colors = [];
st.colors = st.colors.filter(c => COLOR_GROUPS.some(g => g.name === c));
for (const k of ['color', 'length', 'sil', 'sleeve', 'neck']) delete st[k];
const CLEAR = { cat: null, sub: null, kind: null, colors: [], brands: [], shop: '', q: '', photo: '', link: '', status: '', core: '', fav: '' };
const brandsOn = () => st.brands.length && st.brands.length < BRANDS.length;
const anyOn = () => !!(st.cat || st.colors.length || brandsOn() || st.shop || st.q || st.photo || st.link || st.status || st.core || st.fav);
// Категории деревом (вариант А, выбрала Мария 09.10.26): категория → подкатегория → тип; тип — если у подкатегории их хотя бы два.
// Дерево строится один раз, дальше меняются только отметки, числа и раскрытие — так ветки раскрываются плавно и ничего не скачет.
const TREE = CAT_ORDER.filter(c => ITEMS.some(i => i.cat === c)).map(c => ({ name: c, subs: [...new Set(ITEMS.filter(i => i.cat === c).map(i => i.sub).filter(Boolean))].map(s => {
  const kinds = [...new Set(ITEMS.filter(i => i.cat === c && i.sub === s).map(i => i.kind).filter(k => k && k !== '—'))];
  return { name: s, kinds: kinds.length >= 2 ? kinds : [] }; }) }));
if (st.kind === undefined) st.kind = null;
{ const t = TREE.find(x => x.name === st.cat), u = t && t.subs.find(x => x.name === st.sub);
  if (!t) Object.assign(st, { cat: null, sub: null, kind: null }); else if (st.sub && !u) Object.assign(st, { sub: null, kind: null }); else if (st.kind && !(u && u.kinds.includes(st.kind))) st.kind = null; }
const treeOpen = new Set();
if (st.cat) { treeOpen.add(st.cat); if (st.sub && TREE.find(t => t.name === st.cat).subs.find(x => x.name === st.sub).kinds.length) treeOpen.add(st.cat + '|' + st.sub); }
const save = () => { try { localStorage.setItem('wardrobe-filters', JSON.stringify(st)); } catch (e) {} };

function match(it, skip) {
  const qn = (st.q || '').trim().match(/^[#№]?(\d+)$/);
  if (qn) return it.no === +qn[1];
  if (skip !== 'cat' && st.cat && it.cat !== st.cat) return false;
  if (skip !== 'cat' && st.sub && it.sub !== st.sub) return false;
  if (skip !== 'cat' && st.kind && it.kind !== st.kind) return false;
  if (skip !== 'color' && st.colors.length && !st.colors.includes(colorGroup(it.color)?.name)) return false;
  if (skip !== 'brand' && st.brands.length && st.brands.length < BRANDS.length && !st.brands.includes(bgroup(it.brand))) return false;
  if (st.shop && !(it.shop || '').split(', ').includes(st.shop)) return false;
  if (st.photo === 'yes' && !it.photo) return false;
  if (st.photo === 'no' && it.photo) return false;
  if (st.link === 'yes' && !it.links.length) return false;
  if (st.link === 'no' && it.links.length) return false;
  if (st.status && it.status !== st.status) return false;
  if (st.core === 'yes' && !it.core) return false;
  if (st.core === 'no' && it.core) return false;
  if (st.fav === 'yes' && !it.fav) return false;
  if (st.q) { const hay = (it.name + ' ' + it.brand + ' ' + it.color + ' ' + it.fabric + ' ' + it.sub + ' ' + it.kind + ' ' + it.notes + ' #' + it.no).toLowerCase(); if (!st.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false; }
  return true;
}
function photoHTML(it, big) {
  const src = big ? it.photo : (it.thumb || it.photo);
  // в вебе фото лежат в закрытом репозитории — их подгружает app.js по ключу (data-file)
  if (src && window.__WEB) return `<img class="${it.photoKind}" data-file="${esc(src)}" data-v="${esc(it.pv || '')}" alt="${esc(it.name)}">`;
  if (src) return `<img class="${it.photoKind}" src="${esc(src)}" alt="${esc(it.name)}" loading="lazy">`;
  return `<div class="ph-empty"><span class="dot" style="background:${swatch(it.color)}"></span>${big ? 'Фото пока нет' : ''}</div>`;
}
function renderFilters() {
  const base = ITEMS.filter(it => match(it, 'cat'));
  syncTree(base);
  const cbase = ITEMS.filter(it => match(it, 'color'));
  document.getElementById('f-color').innerHTML = COLOR_GROUPS.filter(g => ITEMS.some(i => colorGroup(i.color) === g)).map(g => `<button class="chip" data-color="${esc(g.name)}" aria-pressed="${st.colors.includes(g.name)}"><span class="sw" style="background:${g.sw}"></span>${esc(g.name)} <span class="n">${cbase.filter(i => colorGroup(i.color) === g).length}</span></button>`).join('');
  const bbase = ITEMS.filter(it => match(it, 'brand'));
  document.getElementById('f-brand-list').innerHTML = BRANDS.map(b => { const n = bbase.filter(i => bgroup(i.brand) === b.k).length;
    return `<label data-k="${esc(b.k)}"${n ? '' : ' class="zero"'}><input type="checkbox" value="${esc(b.k)}" ${st.brands.includes(b.k) ? 'checked' : ''}><span>${esc(b.name)}</span><span class="n">${n}</span></label>`; }).join('');
  document.querySelectorAll('#f-brand-list input').forEach(c => c.onchange = () => { st.brands = c.checked ? [...st.brands, c.value] : st.brands.filter(k => k !== c.value); render(); });
  filterBrandList();
  const picked = BRANDS.filter(b => st.brands.includes(b.k)).map(b => b.name);
  document.getElementById('f-brand-sum').textContent = !picked.length || picked.length === BRANDS.length ? 'Все бренды' : picked.length <= 2 ? picked.join(', ') : `${picked.slice(0, 2).join(', ')} и ещё ${picked.length - 2}`;
  const shops = [...new Set(ITEMS.flatMap(i => (i.shop || '').split(', ')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  document.getElementById('f-shop').innerHTML = `<option value="">Все магазины</option>` + shops.map(x => `<option ${st.shop === x ? 'selected' : ''}>${esc(x)}</option>`).join('');
  const seg = (id, key, opts) => { const el = document.getElementById(id); el.innerHTML = opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${st[key] === v}">${t}</button>`).join(''); el.querySelectorAll('button').forEach(b => b.onclick = () => { st[key] = b.dataset.v; render(); }); };
  seg('f-photo', 'photo', [['', 'Все'], ['yes', 'С фото'], ['no', 'Без фото']]);
  seg('f-link', 'link', [['', 'Все'], ['yes', 'Со ссылкой'], ['no', 'Без ссылки']]);
  const statuses = [...new Set(ITEMS.map(i => i.status))].sort((a, b) => a === 'дома' ? -1 : b === 'дома' ? 1 : a.localeCompare(b, 'ru'));
  seg('f-status', 'status', [['', 'Все'], ...statuses.map(x => [x, x[0].toUpperCase() + x.slice(1)])]);
  seg('f-fav', 'fav', [['', 'Все'], ['yes', '⭐ Любимые']]);
  seg('f-core', 'core', [['', 'Все'], ['yes', 'Актуальное'], ['no', 'Архив']]);
  const on = { colors: st.colors.length, brands: brandsOn(), shop: st.shop };
  document.querySelectorAll('.clr').forEach(b => b.classList.toggle('off', !on[b.dataset.clr]));
  document.getElementById('reset').disabled = !anyOn();
  document.getElementById('q').value = st.q;
  document.getElementById('sort').value = st.sort;
  document.querySelectorAll('#f-color .chip').forEach(b => b.onclick = () => { const c = b.dataset.color; st.colors = st.colors.includes(c) ? st.colors.filter(x => x !== c) : [...st.colors, c]; render(); });
}
function buildTree() {
  const CHEV = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4"/></svg>';
  const tw = (key, name) => `<button class="tw" type="button" data-t="${esc(key)}" aria-label="Раскрыть: ${esc(name)}">${CHEV}</button>`;
  const lbl = (p, name, cls = '') => `<button class="lbl${cls}" type="button" data-p="${esc(p)}"><span>${esc(name)}</span><span class="n"></span></button>`;
  const kids = (key, inner) => `<div class="kids" data-k="${esc(key)}"><div><div class="kids-in">${inner}</div></div></div>`;
  const el = document.getElementById('f-cat');
  el.innerHTML = `<div class="tree"><div class="trow"><span></span>${lbl('', 'Все')}</div>` + TREE.map(c => `<div class="trow">${tw(c.name, c.name)}${lbl(c.name, c.name)}</div>` +
    kids(c.name, c.subs.map(u => { const key = c.name + '|' + u.name;
      return `<div class="trow">${u.kinds.length ? tw(key, u.name) : '<span></span>'}${lbl(key, u.name, ' sub')}</div>` +
        (u.kinds.length ? kids(key, u.kinds.map(k => `<div class="trow"><span></span>${lbl(key + '|' + k, k, ' kind')}</div>`).join('')) : ''); }).join(''))).join('') + '</div>';
  el.querySelectorAll('.lbl').forEach(b => b.onclick = () => {
    const [c = null, u = null, k = null] = b.dataset.p ? b.dataset.p.split('|') : [];
    if (c && !u) { treeOpen.clear(); treeOpen.add(c); }
    if (c && u && !k) { treeOpen.add(c); [...treeOpen].forEach(x => { if (x.includes('|') && x !== c + '|' + u) treeOpen.delete(x); });
      if (TREE.find(t => t.name === c).subs.find(x => x.name === u).kinds.length) treeOpen.add(c + '|' + u); }
    Object.assign(st, { cat: c, sub: u, kind: k }); render();
    // список вещей стал короче — вернуть к его началу, если ушла ниже
    const top = document.querySelector('section .bar').getBoundingClientRect().top + window.scrollY - 12;
    if (window.scrollY > top) window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  el.querySelectorAll('.tw').forEach(b => b.onclick = () => { const t = b.dataset.t; treeOpen.has(t) ? treeOpen.delete(t) : treeOpen.add(t); syncTree(ITEMS.filter(it => match(it, 'cat'))); });
}
function syncTree(base) {
  const el = document.getElementById('f-cat');
  el.querySelectorAll('.lbl').forEach(b => { const [c = null, u = null, k = null] = b.dataset.p ? b.dataset.p.split('|') : [];
    b.setAttribute('aria-pressed', String(st.cat === c && st.sub === u && st.kind === k));
    b.querySelector('.n').textContent = base.filter(i => (!c || i.cat === c) && (!u || i.sub === u) && (!k || i.kind === k)).length; });
  el.querySelectorAll('.kids').forEach(k => k.classList.toggle('open', treeOpen.has(k.dataset.k)));
  el.querySelectorAll('.tw').forEach(b => b.setAttribute('aria-expanded', String(treeOpen.has(b.dataset.t))));
}
function filterBrandList() {
  const q = brandQ.trim().toLowerCase();
  document.querySelectorAll('#f-brand-list label').forEach(l => { l.hidden = !!q && !l.textContent.toLowerCase().includes(q); });
}
function render() {
  save(); renderFilters();
  let list = ITEMS.filter(it => match(it));
  if (st.sort === 'new') list = list.slice().sort((a, b) => b.no - a.no);
  if (st.sort === 'name') list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  document.getElementById('count').textContent = `Показано ${list.length} из ${ITEMS.length}`;
  document.getElementById('grid').innerHTML = list.length ? list.map(it => `<button class="card" data-no="${it.no}">
      <div class="ph">${photoHTML(it)}<div class="badges">${it.fav ? '<span class="badge">⭐</span>' : ''}${it.status !== 'дома' ? `<span class="badge transit">${esc(it.status)}</span>` : ''}${!it.core ? '<span class="badge">архив</span>' : ''}${it.photoKind === 'store' ? '<span class="badge">фото магазина</span>' : ''}</div></div>
      <div class="cname">${esc(it.short || it.name)}</div><div class="cmeta"><b class="cno">${it.no}</b> · ${[it.brand, it.color].filter(Boolean).map(esc).join(' · ')}</div></button>`).join('') : '<div class="empty">Ничего не нашлось — попробуй сбросить фильтры</div>';
  document.querySelectorAll('.card').forEach(c => c.onclick = () => openItem(+c.dataset.no));
  if (window.__loadPhotos) window.__loadPhotos(document.getElementById('grid'));
}
function openItem(no) {
  const it = ITEMS.find(i => i.no === no); const d = document.getElementById('dlg');
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${md(v)}</dd>` : '';
  d.innerHTML = `<div class="dlg" style="position:relative"><div class="ph">${photoHTML(it, true)}</div>
    <div class="dlg-body"><div class="cap">${it.no} · ${esc([it.cat, it.sub, it.kind].filter(Boolean).join(' / '))}</div><h2>${esc(it.name)}</h2>
    <dl class="props">${row('Бренд', it.brand)}${row('Статус', it.status !== 'дома' ? it.status : '')}${row('Актуальное', it.core ? '' : 'нет, в архиве')}${row('Уход', it.care)}${row('Фасон', [it.length, it.sil, it.sleeve && (it.sleeve === 'без рукава' ? it.sleeve : 'рукав ' + it.sleeve), it.neck].filter(Boolean).join(', '))}${row('Размер', it.size)}${row('Цена', it.price ? it.price + ' ₽' : '')}${row('Вес и объём', [it.weight && it.weight + ' г', it.volume && it.volume + ' л'].filter(Boolean).join(', '))}${row('Где куплено', it.shop)}${row('Цвет', it.color)}${row('Состав', it.fabric)}${row('Куплено', it.year)}${row('Фото', it.photoKind === 'studio' ? 'студийное, Codex по фото' : it.photoKind === 'own' ? 'своё' : it.photoKind === 'store' ? 'с сайта магазина' : '')}</dl>
    ${it.notes ? `<div class="notes">${md(it.notes)}</div>` : ''}
    ${it.links.length ? `<div class="links">${it.links.map(l => `<a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)} ↗</a>`).join('')}</div>` : ''}
    </div><button class="close" type="button" aria-label="Закрыть">✕</button></div>`;
  d.querySelector('.close').onclick = () => d.close();
  d.onclick = (e) => { if (e.target === d) d.close(); };
  d.showModal();
  if (window.__loadPhotos) window.__loadPhotos(d);
}
document.getElementById('q').oninput = (e) => { st.q = e.target.value; render(); };
document.getElementById('ftoggle').onclick = (e) => { const open = document.body.classList.toggle('fopen'); e.currentTarget.setAttribute('aria-expanded', String(open)); };
document.getElementById('f-brand-q').oninput = (e) => { brandQ = e.target.value; filterBrandList(); };
document.getElementById('f-brand-all').onclick = () => { const shown = [...document.querySelectorAll('#f-brand-list label:not([hidden])')].map(l => l.dataset.k); st.brands = [...new Set([...st.brands, ...shown])]; render(); };
document.getElementById('f-brand-none').onclick = () => { st.brands = []; render(); };
document.getElementById('f-shop').onchange = (e) => { st.shop = e.target.value; render(); };
document.getElementById('sort').onchange = (e) => { st.sort = e.target.value; render(); };
document.getElementById('reset').onclick = () => { Object.assign(st, structuredClone(CLEAR)); render(); };
document.querySelectorAll('.clr').forEach(b => b.onclick = () => { st[b.dataset.clr] = structuredClone(CLEAR[b.dataset.clr]); render(); });
buildTree();
render();

/* ---------- В поездку: отбор вещей в список «Поездок» (только веб — нужен ключ к trips-data) ----------
   Выбранное хранится в самой поездке: раздел «Одежда и обувь», у вещи из гардероба поле wardrobe = номер.
   Решения Марии 10.10.26: отбор в гардеробе, в «Поездки» — полное название и номер, подгруппы как в каталоге;
   группы с подгруппами, невыбранные бледнее, число в розовом кружке, отправка сама через пару секунд. */
const TRIP_SECTION = 'Одежда и обувь';
const T = { id: null, title: '', dates: null, picked: new Set(), open: '', sub: {}, status: 'ok', reminders: [], drawer: false, timer: null, busy: false, again: false };
const tItems = () => ITEMS.filter(i => i.core);
const tCats = () => CAT_ORDER.filter(c => tItems().some(i => i.cat === c));
const tDates = (d) => { if (!d || !d.start) return ''; const [, m1, d1] = d.start.split('-'), [, m2, d2] = (d.end || d.start).split('-'); return m1 === m2 ? `${+d1}–${+d2}.${m1}` : `${+d1}.${m1}–${+d2}.${m2}`; };
const tLine = (it) => ({ text: `${it.name} · ${it.no}`, done: false, bag: null, group: it.cat, sub: it.sub || '', parent: '', wardrobe: it.no });
const tThings = (n) => { const a = n % 10, b = n % 100; return `${n} ${a === 1 && b !== 11 ? 'вещь' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'вещи' : 'вещей'}`; };

async function tPicker() {
  const d = document.getElementById('dlg');
  d.innerHTML = '<div class="tpick"><h2>В какую поездку?</h2><p class="thint">Загружаю поездки…</p></div>'; d.showModal();
  d.onclick = (e) => { if (e.target === d) d.close(); };
  try {
    const list = (await window.__trips.list()).slice().sort((a, b) => (b.dates?.start || '').localeCompare(a.dates?.start || ''));
    const today = new Date().toISOString().slice(0, 10);
    d.querySelector('.tpick').innerHTML = '<h2>В какую поездку?</h2>' + list.map(t => `<button class="trow${(t.dates?.end || '') < today ? ' past' : ''}" type="button" data-trip="${esc(t.id)}"><span>${esc(t.title)}</span><span class="thint">${esc(tDates(t.dates))}${t.dates?.start ? '.' + t.dates.start.slice(0, 4) : ''}</span></button>`).join('')
      + '<p class="thint">Новую поездку заводим в «Поездках».</p>';
    d.querySelectorAll('[data-trip]').forEach(b => b.onclick = () => { d.close(); tEnter(b.dataset.trip); });
  } catch (e) {
    d.querySelector('.tpick').innerHTML = `<h2>В какую поездку?</h2><p class="thint">${e.status === 404 || e.status === 403 ? 'У этого ключа нет доступа к «Поездкам». Войди ключом «Поездок».' : 'Не получилось загрузить поездки — проверь интернет.'}</p>`;
  }
}
async function tEnter(id) {
  Object.assign(T, { id, picked: new Set(), reminders: [], drawer: false, status: 'load' });
  document.querySelector('.layout').hidden = true; document.getElementById('trip').hidden = false;
  document.getElementById('q').hidden = true; document.getElementById('tripopen').hidden = true; tRender();
  try {
    const { data } = await window.__trips.read(id);
    T.title = data.title; T.dates = data.dates;
    const sec = (data.packing?.sections || []).find(s => s.title === TRIP_SECTION);
    (sec ? sec.items : []).forEach(i => { if (i.wardrobe && ITEMS.some(x => x.no === i.wardrobe)) T.picked.add(i.wardrobe); });
    T.status = 'ok'; T.open = T.open || tCats()[0];
    try { localStorage.setItem('wardrobe-trip', id); } catch (e) {}
  } catch (e) { T.status = 'loaderr'; }
  tRender(); window.scrollTo(0, 0);
}
function tExit() { document.getElementById('trip').hidden = true; document.querySelector('.layout').hidden = false; document.getElementById('q').hidden = false; document.getElementById('tripopen').hidden = false; T.drawer = false; tDrawer(); try { localStorage.removeItem('wardrobe-trip'); } catch (e) {} render(); }
function tToggle(no) {
  T.picked.has(no) ? T.picked.delete(no) : T.picked.add(no);
  T.status = 'busy'; tRender(); clearTimeout(T.timer); T.timer = setTimeout(tSync, 2000);
}
function tApply(data) {
  data.packing = data.packing || { sections: [] };
  let sec = data.packing.sections.find(s => s.title === TRIP_SECTION);
  if (!sec) { sec = { title: TRIP_SECTION, items: [] }; data.packing.sections.unshift(sec); }
  const have = new Set(sec.items.filter(i => i.wardrobe).map(i => i.wardrobe));
  sec.items = sec.items.filter(i => {
    if (!i.wardrobe || T.picked.has(i.wardrobe)) return true;
    if (i.done && !T.reminders.includes(i.wardrobe)) T.reminders.push(i.wardrobe);
    return false;
  });
  ITEMS.filter(it => T.picked.has(it.no) && !have.has(it.no)).forEach(it => {
    let at = -1; sec.items.forEach((x, k) => { if ((x.group || '') === it.cat) at = k; });
    if (at < 0) sec.items.push(tLine(it)); else sec.items.splice(at + 1, 0, tLine(it));
  });
}
async function tSync() {
  if (T.busy) { T.again = true; return; }
  T.busy = true; T.again = false; const id = T.id;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, sha } = await window.__trips.read(id);
      tApply(data);
      await window.__trips.write(id, data, sha, `«${data.title}»: вещи из гардероба`);
      T.status = 'ok'; break;
    } catch (e) {
      if ((e.status === 409 || e.status === 422) && attempt < 2) continue;
      T.status = e.status === 403 || e.status === 404 ? 'denied' : 'err'; break;
    }
  }
  T.busy = false; if (T.id === id) tRender();
  if (T.again) tSync();
}
function tRender() {
  const el = document.getElementById('trip'); if (el.hidden) return;
  const pk = [...T.picked];
  const st2 = { load: ['busy', 'Загружаю поездку…'], loaderr: ['err', 'Не получилось открыть поездку — проверь интернет'], busy: ['busy', 'Отправляю в «Поездки»…'], ok: ['', pk.length ? 'В «Поездках» актуально' : 'Пока ничего не выбрано'],
    err: ['err', 'Не отправилось — проверь интернет; отправлю при следующем выборе'], denied: ['err', 'У этого ключа нет доступа к «Поездкам»'] }[T.status] || ['', ''];
  const groups = tCats().map(c => {
    const all = tItems().filter(i => i.cat === c), n = all.filter(i => T.picked.has(i.no)).length, open = T.open === c;
    const subs = [...new Set(all.map(i => i.sub).filter(Boolean))], cur = T.sub[c] || '';
    const list = all.filter(i => !cur || i.sub === cur);
    return `<section class="tgrp${n ? ' has' : ''}"><button type="button" data-topen="${esc(c)}" aria-expanded="${open}"><span class="name">${esc(c)}</span><span class="cnt">${n ? `выбрано <b>${n}</b> · ` : ''}${all.length}</span></button>
      ${open ? `<div class="inner">${subs.length > 1 ? `<div class="tsubs">${['', ...subs].map(s => { const k = all.filter(i => (!s || i.sub === s) && T.picked.has(i.no)).length;
          return `<button class="tsub" type="button" data-tsub="${esc(c)}|${esc(s)}" aria-pressed="${cur === s}">${esc(s || 'Все')} <span class="n">${all.filter(i => !s || i.sub === s).length}</span>${k ? `<span class="tnum">${k}</span>` : ''}</button>`; }).join('')}</div>` : ''}
        <div class="grid">${list.map(it => { const on = T.picked.has(it.no);
          return `<button class="card tcard${on ? ' on' : ''}" type="button" data-tno="${it.no}" aria-pressed="${on}"><div class="ph">${photoHTML(it)}<span class="tmark" aria-hidden="true">${on ? '✓' : '+'}</span></div>
            <div class="cname">${esc(it.short || it.name)}</div><div class="cmeta"><b class="cno">${it.no}</b> · ${[it.brand, it.color].filter(Boolean).map(esc).join(' · ')}</div></button>`; }).join('')}</div></div>` : ''}</section>`;
  }).join('');
  el.innerHTML = `<div class="tbar"><div class="who"><button class="tback" type="button" data-texit="1">← Каталог</button><div class="t">${esc(T.title || 'Поездка')}<span>${esc(tDates(T.dates))}</span></div>
    <div class="tsync ${st2[0]}"><i></i>${esc(st2[1])}</div></div><button class="tbtn" type="button" data-tdrawer="1">Список · ${pk.length}</button></div>${T.status === 'load' || T.status === 'loaderr' ? '' : groups}`;
  if (window.__loadPhotos) window.__loadPhotos(el);
  tDrawer();
}
function tDrawer() {
  const box = document.getElementById('tripdrawer');
  if (!T.drawer) { box.innerHTML = ''; return; }
  const by = {}; [...T.picked].forEach(n => { const it = ITEMS.find(i => i.no === n); if (it) (by[it.cat] = by[it.cat] || []).push(it); });
  const rem = T.reminders.map(n => ITEMS.find(i => i.no === n)).filter(Boolean);
  box.innerHTML = `<div class="tshade" data-tclose="1"></div><aside class="tdrawer" aria-label="Список для «Поездок»"><header><b>Список · ${tThings(T.picked.size)}</b><button class="tclose" type="button" data-tclose="1">Закрыть</button></header>
    <div class="body">${rem.length ? `<div class="tremind">Уже была собрана — вынь из чемодана: ${rem.map(it => `${esc(it.name)} · ${it.no}`).join('; ')}. <button type="button" data-tforget="1">Вынула</button></div>` : ''}
    <p class="tsec">${TRIP_SECTION} <span class="thint" style="display:inline">— так в «Поездках»</span></p>
    ${CAT_ORDER.filter(c => by[c]).map(c => `<p class="tsec">${esc(c)}</p>${by[c].map(it => `<div class="tli"><span>${esc(it.name)} <span class="num">· ${it.no}</span></span><button type="button" data-tno="${it.no}" aria-label="Убрать">×</button></div>`).join('')}`).join('') || '<p class="thint">Пока пусто — нажимай на вещи.</p>'}
    <p class="thint" style="margin-top:10px">Что куда положить и галочки — в «Поездках».</p></div></aside>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tno], [data-topen], [data-tsub], [data-texit], [data-tdrawer], [data-tclose], [data-tforget], #tripopen'); if (!b) return;
  const d = b.dataset;
  if (b.id === 'tripopen') return tPicker();
  if (d.tno) return tToggle(+d.tno);
  if (d.topen !== undefined) { T.open = T.open === d.topen ? '' : d.topen; return tRender(); }
  if (d.tsub !== undefined) { const [c, s] = d.tsub.split('|'); T.sub[c] = s; return tRender(); }
  if (d.texit) return tExit();
  if (d.tdrawer) { T.drawer = true; return tDrawer(); }
  if (d.tclose) { T.drawer = false; return tDrawer(); }
  if (d.tforget) { T.reminders = []; return tDrawer(); }
});
if (window.__trips) {
  document.getElementById('tripopen').hidden = false;
  let last = null; try { last = localStorage.getItem('wardrobe-trip'); } catch (e) {}
  if (last) tEnter(last);
}

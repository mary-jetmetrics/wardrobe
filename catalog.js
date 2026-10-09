'use strict';
const ITEMS = window.__ITEMS;
const CAT_ORDER = ['Верх', 'Низ', 'Платья', 'Комбинезоны', 'Купальники', 'Обувь', 'Аксессуары', 'Бельё'];
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
const st = { cat: null, sub: null, color: null, brands: [], shop: '', q: '', photo: '', link: '', status: '', fav: '', length: '', sil: '', sleeve: '', neck: '', sort: 'no' };
try { Object.assign(st, JSON.parse(localStorage.getItem('wardrobe-filters') || '{}')); } catch (e) {}
if (typeof st.photo !== 'string') st.photo = st.photo ? 'yes' : '';
if ('brand' in st) { if (st.brand) st.brands = [String(st.brand).toLowerCase()]; delete st.brand; }
if (!Array.isArray(st.brands)) st.brands = [];
const bkey = (b) => (b || '').trim().toLowerCase();
// Бренд, записанный в базе по-разному (SELA / Sela), — одна строка; показываем самое частое написание
const BRANDS = (() => { const m = new Map(); for (const i of ITEMS) { const k = bkey(i.brand); if (!k) continue; const e = m.get(k) || {}; e[i.brand] = (e[i.brand] || 0) + 1; m.set(k, e); }
  return [...m].map(([k, e]) => ({ k, name: Object.entries(e).sort((a, b) => b[1] - a[1])[0][0] })).sort((a, b) => a.name.localeCompare(b.name, 'ru')); })();
let brandQ = '';
delete st.transit;
if (st.color && !COLOR_GROUPS.some(g => g.name === st.color)) st.color = null;
const save = () => { try { localStorage.setItem('wardrobe-filters', JSON.stringify(st)); } catch (e) {} };

function match(it, skip) {
  const qn = (st.q || '').trim().match(/^[#№]?(\d+)$/);
  if (qn) return it.no === +qn[1];
  if (skip !== 'cat' && st.cat && it.cat !== st.cat) return false;
  if (skip !== 'cat' && st.sub && it.sub !== st.sub) return false;
  if (skip !== 'color' && st.color && colorGroup(it.color)?.name !== st.color) return false;
  if (skip !== 'brand' && st.brands.length && st.brands.length < BRANDS.length && !st.brands.includes(bkey(it.brand))) return false;
  if (st.shop && !(it.shop || '').split(', ').includes(st.shop)) return false;
  if (st.photo === 'yes' && !it.photo) return false;
  if (st.photo === 'no' && it.photo) return false;
  if (st.link === 'yes' && !it.links.length) return false;
  if (st.link === 'no' && it.links.length) return false;
  if (st.status && it.status !== st.status) return false;
  if (st.fav === 'yes' && !it.fav) return false;
  for (const f of ['length', 'sil', 'sleeve', 'neck']) if (st[f] && it[f] !== st[f]) return false;
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
  const cats = CAT_ORDER.filter(c => ITEMS.some(i => i.cat === c));
  document.getElementById('f-cat').innerHTML = `<button class="fbtn" data-cat="" aria-pressed="${!st.cat}"><span>Все</span><span class="n">${base.length}</span></button>` + cats.map(c => {
    const n = base.filter(i => i.cat === c).length;
    const subs = st.cat === c ? [...new Set(ITEMS.filter(i => i.cat === c).map(i => i.sub).filter(Boolean))] : [];
    return `<button class="fbtn" data-cat="${c}" aria-pressed="${st.cat === c && !st.sub}"><span>${c}</span><span class="n">${n}</span></button>` + (subs.length ? `<div class="sublist">${subs.map(s => `<button class="fbtn" data-cat="${c}" data-sub="${esc(s)}" aria-pressed="${st.sub === s}"><span>${esc(s)}</span><span class="n">${base.filter(i => i.cat === c && i.sub === s).length}</span></button>`).join('')}</div>` : '');
  }).join('');
  const cbase = ITEMS.filter(it => match(it, 'color'));
  document.getElementById('f-color').innerHTML = COLOR_GROUPS.filter(g => ITEMS.some(i => colorGroup(i.color) === g)).map(g => `<button class="chip" data-color="${esc(g.name)}" aria-pressed="${st.color === g.name}"><span class="sw" style="background:${g.sw}"></span>${esc(g.name)} <span class="n">${cbase.filter(i => colorGroup(i.color) === g).length}</span></button>`).join('');
  const bbase = ITEMS.filter(it => match(it, 'brand'));
  document.getElementById('f-brand-list').innerHTML = BRANDS.map(b => { const n = bbase.filter(i => bkey(i.brand) === b.k).length;
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
  const facet = (id, key, label) => { const vals = [...new Set(ITEMS.map(i => i[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')); const el = document.getElementById(id); el.innerHTML = `<option value="">${label}: все</option>` + vals.map(v => `<option value="${esc(v)}" ${st[key] === v ? 'selected' : ''}>${esc(v)}</option>`).join(''); el.onchange = (e) => { st[key] = e.target.value; render(); }; };
  facet('f-length', 'length', 'Длина'); facet('f-sil', 'sil', 'Силуэт'); facet('f-sleeve', 'sleeve', 'Рукав'); facet('f-neck', 'neck', 'Вырез');
  document.getElementById('q').value = st.q;
  document.getElementById('sort').value = st.sort;
  document.querySelectorAll('#f-cat .fbtn').forEach(b => b.onclick = () => { st.cat = b.dataset.cat || null; st.sub = b.dataset.sub || null; render(); });
  document.querySelectorAll('#f-color .chip').forEach(b => b.onclick = () => { st.color = st.color === b.dataset.color ? null : b.dataset.color; render(); });
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
      <div class="ph">${photoHTML(it)}<div class="badges">${it.fav ? '<span class="badge">⭐</span>' : ''}${it.status !== 'дома' ? `<span class="badge transit">${esc(it.status)}</span>` : ''}${it.photoKind === 'store' ? '<span class="badge">фото магазина</span>' : ''}</div></div>
      <div class="cname">${esc(it.name)}</div><div class="cmeta"><b class="cno">${it.no}</b> · ${[it.brand, it.color].filter(Boolean).map(esc).join(' · ')}</div></button>`).join('') : '<div class="empty">Ничего не нашлось — попробуй сбросить фильтры</div>';
  document.querySelectorAll('.card').forEach(c => c.onclick = () => openItem(+c.dataset.no));
  if (window.__loadPhotos) window.__loadPhotos(document.getElementById('grid'));
}
function openItem(no) {
  const it = ITEMS.find(i => i.no === no); const d = document.getElementById('dlg');
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${md(v)}</dd>` : '';
  d.innerHTML = `<div class="dlg" style="position:relative"><div class="ph">${photoHTML(it, true)}</div>
    <div class="dlg-body"><div class="cap">${it.no} · ${esc([it.cat, it.sub, it.kind].filter(Boolean).join(' / '))}</div><h2>${esc(it.name)}</h2>
    <dl class="props">${row('Бренд', it.brand)}${row('Статус', it.status !== 'дома' ? it.status : '')}${row('Уход', it.care)}${row('Фасон', [it.length, it.sil, it.sleeve && (it.sleeve === 'без рукава' ? it.sleeve : 'рукав ' + it.sleeve), it.neck].filter(Boolean).join(', '))}${row('Размер', it.size)}${row('Цена', it.price ? it.price + ' ₽' : '')}${row('Вес и объём', [it.weight && it.weight + ' г', it.volume && it.volume + ' л'].filter(Boolean).join(', '))}${row('Где куплено', it.shop)}${row('Цвет', it.color)}${row('Состав', it.fabric)}${row('Куплено', it.year)}${row('Фото', it.photoKind === 'studio' ? 'студийное, Codex по фото' : it.photoKind === 'own' ? 'своё' : it.photoKind === 'store' ? 'с сайта магазина' : '')}</dl>
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
document.getElementById('reset').onclick = () => { Object.assign(st, { cat: null, sub: null, color: null, brands: [], shop: '', q: '', photo: '', link: '', status: '', fav: '', length: '', sil: '', sleeve: '', neck: '' }); render(); };
const withPhoto = ITEMS.filter(i => i.photo).length;
document.getElementById('stats').textContent = `${ITEMS.length} вещей · с фото ${withPhoto}` + (window.__WEB ? '' : ' · собрано из гардероб.md');
render();

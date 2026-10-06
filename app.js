import { checkAll, splitTags, tagLength } from './checks.js';

const $ = (id) => document.getElementById(id);
const STORE = 'arqen-packaging-check';
const FIELDS = ['title', 'channel', 'duration', 'description', 'tags'];
const media = { thumb: null, avatar: null, thumbInfo: null };
const rivals = [0, 1, 2].map(() => ({ title: '', thumb: null }));
let theme = 'dark';

try {
  const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
  for (const f of FIELDS) if (typeof saved[f] === 'string') $(f).value = saved[f];
  if (saved.theme) theme = saved.theme;
  (saved.rivals || []).forEach((t, i) => { if (rivals[i]) rivals[i].title = t; });
} catch { /* private window: start fresh */ }
const save = () => {
  try { localStorage.setItem(STORE, JSON.stringify({ ...Object.fromEntries(FIELDS.map((f) => [f, $(f).value])), theme, rivals: rivals.map((r) => r.title) })); } catch { /* ignore */ }
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function loadImage(input, nameEl, done) {
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { done(url, { width: img.naturalWidth, height: img.naturalHeight, bytes: file.size, type: file.type }); if (nameEl) nameEl.textContent = file.name; update(); };
    img.src = url;
  });
}
loadImage($('thumb'), $('thumbName'), (url, info) => { media.thumb = url; media.thumbInfo = info; });
loadImage($('avatar'), $('avatarName'), (url) => { media.avatar = url; });

$('rivals').innerHTML = rivals.map((_, i) => `
  <div class="rival">
    <input data-rival="${i}" placeholder="Their title" value="${esc(rivals[i].title)}">
    <label class="file">Thumb<input type="file" accept="image/*" data-rthumb="${i}"><span>+</span></label>
  </div>`).join('');
document.querySelectorAll('[data-rival]').forEach((el) => el.addEventListener('input', () => { rivals[el.dataset.rival].title = el.value; update(); }));
document.querySelectorAll('[data-rthumb]').forEach((el) => loadImage(el, el.nextElementSibling, (url) => { rivals[el.dataset.rthumb].thumb = url; }));
FIELDS.forEach((f) => $(f).addEventListener('input', update));
$('theme').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) { theme = b.dataset.v; update(); }
});

const PLACEHOLDER = ['A video you compete with', 'Another video in the same topic', 'One more video next to yours'];

/** The cards in a surface: yours second, so it is seen among others like in a real feed. */
function videos() {
  const mine = { title: $('title').value.trim() || 'Your title', thumb: media.thumb, channel: $('channel').value || 'Your Channel', avatar: media.avatar, duration: $('duration').value, views: '1.2K views · 2 hours ago', mine: true };
  const others = rivals.map((r, i) => ({ title: r.title || PLACEHOLDER[i], thumb: r.thumb, channel: r.title ? 'Other channel' : '', views: r.title ? '48K views · 3 days ago' : '', duration: r.title ? '9:41' : '', ph: !r.title && !r.thumb }));
  return [others[0], mine, others[1], others[2]];
}

const thumb = (v) => `<div class="thumb">${v.thumb ? `<img src="${v.thumb}" alt="">` : ''}${v.duration ? `<span class="dur">${esc(v.duration)}</span>` : ''}</div>`;
const avatar = (v) => `<div class="av">${v.avatar ? `<img src="${v.avatar}" alt="">` : ''}</div>`;
const cls = (v) => `${v.mine ? 'mine' : ''} ${v.ph ? 'ph' : ''}`;

function card(v) {
  return `<div class="card ${cls(v)}">${thumb(v)}<div class="meta">${avatar(v)}<div style="min-width:0"><div class="t">${esc(v.title)}</div>
    <div class="sub">${esc(v.channel)}</div><div class="sub">${esc(v.views)}</div></div></div></div>`;
}
function rowcard(v, withDesc) {
  const desc = withDesc && v.mine ? `<div class="desc">${esc($('description').value.split('\n')[0])}</div>` : '';
  return `<div class="rowcard ${cls(v)}">${thumb(v)}<div style="min-width:0"><div class="t">${esc(v.title)}</div>
    <div class="sub">${esc(v.channel)}</div><div class="sub">${esc(v.views)}</div>${desc}</div></div>`;
}

function update() {
  const list = videos();
  const feeds = $('feeds');
  feeds.className = `feeds yt ${theme}`;
  document.querySelectorAll('#theme button').forEach((b) => b.classList.toggle('on', b.dataset.v === theme));
  feeds.innerHTML = `
    <div class="surface"><h3>Desktop · Home</h3><div class="grid">${list.map(card).join('')}</div></div>
    <div class="surface phone"><h3>Phone · Home</h3>${list.slice(0, 2).map(card).join('')}</div>
    <div class="surface search"><h3>Desktop · Search</h3>${list.slice(0, 3).map((v) => rowcard(v, true)).join('')}</div>
    <div class="surface"><h3>Up next · Suggested</h3>${list.map((v) => rowcard(v, false)).join('')}</div>`;

  const title = $('title').value.trim();
  const desc = $('description').value;
  $('titleCount').textContent = `${title.length}/100`;
  $('titleCount').classList.toggle('over', title.length > 100);
  $('descCount').textContent = `${desc.trim().length}/5000`;
  const tl = tagLength(splitTags($('tags').value));
  $('tagCount').textContent = `${tl}/500`;
  $('tagCount').classList.toggle('over', tl > 500);

  const results = checkAll({ title, description: desc, tags: $('tags').value, thumbnail: media.thumbInfo });
  const n = (l) => results.filter((r) => r.level === l).length;
  $('score').innerHTML = `<b style="color:var(--pass)">${n('pass')} ok</b> · <b style="color:var(--warn)">${n('warn')} to consider</b> · <b style="color:var(--fail)">${n('fail')} to fix</b>`;
  const order = { fail: 0, warn: 1, pass: 2 };
  $('checks').innerHTML = results.sort((a, b) => order[a.level] - order[b.level])
    .map((r) => `<li class="${r.level}"><b>${r.area}</b>${esc(r.text)}</li>`).join('');
  save();
}

update();

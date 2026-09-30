import { TIPOS, ML_POR_MATE, normalize, stats, titulo, perfil, lastDays, fmtLitros, dayKey, hhmm, startOfDay, racha } from './lib.js';

const KEY = 'amargometro:v1';
const $ = (s) => document.querySelector(s);
const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

let entries = [];
let tipo = 'amargo';
let periodo = 'semana';
let storageOk = true;

function load() {
  try {
    entries = normalize(JSON.parse(localStorage.getItem(KEY) || 'null'));
  } catch {
    entries = [];
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, entries }));
    storageOk = true;
  } catch {
    storageOk = false;
    toast('No pude guardar en este navegador. Exportá para no perder lo anotado.');
  }
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const plural = (n, s, p) => (n === 1 ? s : p);

/* ---------- render ---------- */
function render() {
  const now = Date.now();
  const hoyK = dayKey(now);
  const hoy = entries.filter((e) => dayKey(e.t) === hoyK);
  const d = new Date(now);
  $('#hoy-t').textContent = `${DIAS_L[d.getDay()]} ${d.getDate()} · hoy`;
  $('#n-hoy').textContent = hoy.length;
  $('#n-hoy-u').textContent = plural(hoy.length, 'mate', 'mates');

  const sem = stats(entries, now, 'semana');
  const ant = entries.filter((e) => e.t < startOfDay(now) && e.t >= startOfDay(now) - 6 * 864e5);
  const prom = ant.length / 6;
  let frase;
  if (!entries.length) frase = 'Todavía no anotaste ninguno. Cebá el primero.';
  else if (!hoy.length) frase = racha(entries, now) ? `Hoy todavía no. Tu racha es de ${racha(entries, now)} ${plural(racha(entries, now), 'día', 'días')}.` : 'Hoy todavía no cebaste.';
  else if (prom && hoy.length >= prom + 2) frase = `Vas ${Math.round(hoy.length - prom)} arriba de tu promedio. Se nota.`;
  else if (prom && hoy.length <= prom - 2) frase = 'Día tranquilo para tus cuentas. Se puede remontar.';
  else frase = 'Dentro de tu promedio de la semana.';
  $('#hoy-frase').textContent = frase;

  $('#lista-n').textContent = hoy.length ? `${hoy.length} ${plural(hoy.length, 'mate', 'mates')}` : '';
  const ul = $('#lista');
  ul.replaceChildren();
  if (!hoy.length) {
    const p = document.createElement('p');
    p.className = 'vacio';
    p.textContent = 'Nada anotado hoy.';
    ul.append(p);
  } else {
    const max = 6;
    for (const e of [...hoy].reverse().slice(0, max)) ul.append(rowEl(e));
    if (hoy.length > max) {
      const p = document.createElement('p');
      p.className = 'mono';
      p.style.marginTop = '8px';
      p.textContent = `+ ${hoy.length - max} más · mirá el historial`;
      ul.append(p);
    }
  }

  const days = lastDays(entries, now);
  const mx = Math.max(1, ...days.map((x) => x.n));
  const wk = $('#week');
  wk.replaceChildren();
  for (const x of days) {
    const c = document.createElement('div');
    if (x.hoy) c.className = 'hoy';
    c.innerHTML = `<b>${x.n || ''}</b><span style="height:${Math.max(3, (x.n / mx) * 100)}%"></span><em>${x.hoy ? 'HOY' : x.label}</em>`;
    c.setAttribute('aria-label', `${x.n} ${plural(x.n, 'mate', 'mates')}`);
    wk.append(c);
  }
  $('#sem-prom').textContent = `Prom. ${(sem.n / 7).toLocaleString('es-UY', { maximumFractionDigits: 1 })}`;

  renderWrapped(now);
}

function rowEl(e) {
  const li = document.createElement('li');
  const t = document.createElement('span');
  t.className = 't';
  t.textContent = hhmm(e.t);
  const b = document.createElement('b');
  b.textContent = 'Mate';
  const k = document.createElement('span');
  k.className = 'k';
  k.textContent = TIPOS.find((x) => x.id === e.k).label.toLowerCase();
  const del = document.createElement('button');
  del.className = 'del';
  del.type = 'button';
  del.setAttribute('aria-label', `Borrar el mate de las ${hhmm(e.t)}`);
  del.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8"/></svg>';
  del.onclick = () => {
    entries = entries.filter((x) => x.id !== e.id);
    save();
    render();
    toast('Mate borrado.', 'Deshacer', () => {
      entries = normalize([...entries, e]);
      save();
      render();
    });
  };
  li.append(t, b, k, del);
  return li;
}

const PER_LABEL = { semana: 'Tu semana en mates', mes: 'Tu mes en mates', todo: 'Todos tus mates' };

function wrappedData(now) {
  const s = stats(entries, now, periodo);
  const tt = titulo(s);
  const tipoL = s.tipoTop ? TIPOS.find((x) => x.id === s.tipoTop).label.toLowerCase() : '-';
  const cards = [
    [String(s.n), plural(s.n, 'mate', 'mates')],
    [fmtLitros(s.litros), 'litros de agua'],
    [`${s.racha} ${plural(s.racha, 'día', 'días')}`, 'racha'],
    [tipoL, 'tu estilo'],
  ];
  return { s, tt, cards };
}

function renderWrapped(now) {
  const { s, tt, cards } = wrappedData(now);
  $('#wr-t').textContent = PER_LABEL[periodo] + (s.n ? ` · ${perfil(s)}` : '');
  const h = $('#wr-h');
  h.replaceChildren();
  if (tt.hora) {
    h.append(tt.a);
    const i = document.createElement('i');
    i.textContent = tt.hora;
    h.append(i, '. ' + tt.b);
  } else h.textContent = `${tt.a} ${tt.b}`;
  const st = $('#wr-stats');
  st.replaceChildren();
  for (const [v, l] of cards) {
    const div = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = v;
    const sp = document.createElement('span');
    sp.textContent = l;
    div.append(b, sp);
    st.append(div);
  }
  $('#btn-share').disabled = !s.n;
  $('#btn-share').style.opacity = s.n ? 1 : 0.5;
}

/* ---------- acciones ---------- */
function add(t) {
  const e = { id: uid(), t, k: tipo };
  entries = normalize([...entries, e]);
  save();
  render();
  toast('Anotado.', 'Deshacer', () => {
    entries = entries.filter((x) => x.id !== e.id);
    save();
    render();
  });
  if (navigator.vibrate) navigator.vibrate(12);
}
$('#btn-add').onclick = () => add(Date.now());

const chips = $('#chips');
for (const t of TIPOS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-checked', String(t.id === tipo));
  b.textContent = t.label;
  b.onclick = () => {
    tipo = t.id;
    try { localStorage.setItem('amargometro:tipo', tipo); } catch {}
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === b)));
  };
  chips.append(b);
}
try {
  const gt = localStorage.getItem('amargometro:tipo');
  if (TIPOS.some((x) => x.id === gt)) {
    tipo = gt;
    chips.querySelectorAll('.chip').forEach((c, i) => c.setAttribute('aria-checked', String(TIPOS[i].id === tipo)));
  }
} catch {}

function localInput(t) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
$('.antes').addEventListener('toggle', () => {
  if ($('.antes').open) {
    $('#antes-dt').max = localInput(Date.now());
    $('#antes-dt').value = localInput(Date.now() - 36e5);
  }
});
$('#btn-antes').onclick = () => {
  const v = $('#antes-dt').value;
  const t = v ? new Date(v).getTime() : NaN;
  if (!isFinite(t) || t > Date.now()) return toast('Elegí una fecha y hora que ya pasó.');
  add(t);
};

$('#seg').addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-p]');
  if (!b) return;
  periodo = b.dataset.p;
  $('#seg').querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  renderWrapped(Date.now());
});

/* ---------- tema ---------- */
function temaActual() {
  const t = document.documentElement.dataset.theme;
  if (t === 'claro' || t === 'oscuro') return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}
function pintarTema() {
  const t = temaActual();
  $('#tema-txt').textContent = t === 'oscuro' ? 'Claro' : 'Oscuro';
  document.querySelector('meta[name=theme-color]').content = t === 'oscuro' ? '#141310' : '#F3EFE4';
}
$('#btn-tema').onclick = () => {
  const n = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
  document.documentElement.dataset.theme = n;
  try { localStorage.setItem('amargometro:tema', n); } catch {}
  pintarTema();
};
pintarTema();

/* ---------- datos: exportar / importar / borrar ---------- */
$('#btn-export').onclick = () => {
  const blob = new Blob([JSON.stringify({ app: 'amargometro', v: 1, exportado: new Date().toISOString(), entries }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `amargometro-${dayKey(Date.now())}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Copia exportada.');
};
$('#btn-import').onclick = () => $('#file').click();
$('#file').onchange = async (ev) => {
  const f = ev.target.files[0];
  ev.target.value = '';
  if (!f) return;
  try {
    const inc = normalize(JSON.parse(await f.text()));
    if (!inc.length) return toast('Ese archivo no tiene mates para importar.');
    const seen = new Set(entries.map((e) => `${e.t}|${e.k}`));
    const nuevos = inc.filter((e) => !seen.has(`${e.t}|${e.k}`));
    entries = normalize([...entries, ...nuevos]);
    save();
    render();
    toast(`Importé ${nuevos.length} ${plural(nuevos.length, 'mate', 'mates')}.`);
  } catch {
    toast('No pude leer ese archivo.');
  }
};
$('#btn-borrar').onclick = async () => {
  if (!(await confirmar('¿Borrar todo?', 'Se borran todos tus mates de este navegador. No se puede deshacer. Si querés conservarlos, exportá antes.', 'Borrar todo'))) return;
  entries = [];
  save();
  render();
  toast('Listo, borré todo.');
};

function confirmar(t, p, ok) {
  const d = $('#dlg-conf');
  $('#conf-t').textContent = t;
  $('#conf-p').textContent = p;
  $('#conf-ok').textContent = ok;
  return new Promise((res) => {
    d.addEventListener('close', () => res(d.returnValue === 'si'), { once: true });
    d.returnValue = 'no';
    d.showModal();
  });
}

/* ---------- historial ---------- */
$('#btn-hist').onclick = () => {
  const by = new Map();
  for (const e of entries) by.set(dayKey(e.t), (by.get(dayKey(e.t)) || 0) + 1);
  const body = $('#hist-body');
  body.replaceChildren();
  if (!by.size) {
    const p = document.createElement('p');
    p.textContent = 'Todavía no hay nada anotado.';
    body.append(p);
  }
  for (const [k, n] of [...by.entries()].reverse().slice(0, 120)) {
    const [y, m, dd] = k.split('-').map(Number);
    const dt = new Date(y, m - 1, dd);
    const r = document.createElement('div');
    r.className = 'hrow';
    const a = document.createElement('span');
    a.textContent = `${DIAS_L[dt.getDay()]} ${dd} de ${MESES[m - 1]}`;
    const b = document.createElement('span');
    b.textContent = n;
    r.append(a, b);
    body.append(r);
  }
  $('#dlg-hist').showModal();
};

/* ---------- toast ---------- */
let tt;
function toast(msg, label, fn) {
  $('#toast-t').textContent = msg;
  const b = $('#toast-b');
  b.hidden = !label;
  b.textContent = label || '';
  b.onclick = () => {
    $('#toast').hidden = true;
    fn && fn();
  };
  $('#toast').hidden = false;
  clearTimeout(tt);
  tt = setTimeout(() => ($('#toast').hidden = true), label ? 6000 : 3500);
}

/* ---------- compartir imagen (canvas, sin servidor) ---------- */
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lh;
}

async function imagen() {
  await Promise.all(['700 60px SG', '500 30px SG', '400 28px DM'].map((f) => document.fonts.load(f)));
  const now = Date.now();
  const { s, tt, cards } = wrappedData(now);
  const W = 1080, H = 1920, P = 90;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  x.fillStyle = v('--wrbg');
  x.fillRect(0, 0, W, H);
  x.textBaseline = 'alphabetic';
  // wordmark
  x.fillStyle = v('--wrfg');
  x.font = '700 58px SG';
  x.fillText('amargómetro', P, 150);
  const wm = x.measureText('amargómetro').width;
  x.fillStyle = v('--wrhi');
  x.fillText('.', P + wm, 150);
  // periodo
  x.fillStyle = v('--wrmute');
  x.font = '400 28px DM';
  x.fillText(PER_LABEL[periodo].toUpperCase(), P, 300);
  // titular
  x.font = '700 104px SG';
  let y = 430;
  const partes = tt.hora ? [tt.a, tt.hora + '.', tt.b] : [tt.a + ' ' + tt.b];
  // dibujamos el titular palabra por palabra para poder pintar la hora en acento
  const words = [];
  for (const [i, p] of partes.entries()) for (const w of p.split(' ').filter(Boolean)) words.push({ w, hi: tt.hora && i === 1 });
  let lx = P;
  for (let i = 0; i < words.length; i++) {
    const { w, hi } = words[i];
    const ww = x.measureText(w + ' ').width;
    if (lx + x.measureText(w).width > W - P) { lx = P; y += 116; }
    x.fillStyle = hi ? v('--wrhi') : v('--wrfg');
    x.fillText(w, lx, y);
    lx += ww;
  }
  // stats
  y = Math.max(y + 140, 880);
  const cw = (W - P * 2) / 2;
  cards.forEach(([val, lab], i) => {
    const cx = P + (i % 2) * cw, cy = y + Math.floor(i / 2) * 250;
    x.fillStyle = v('--wrline');
    x.fillRect(cx, cy, cw - 20, 3);
    x.fillStyle = v('--wrfg');
    x.font = '700 92px SG';
    x.fillText(val, cx, cy + 105);
    x.fillStyle = v('--wrmute');
    x.font = '400 27px DM';
    x.fillText(lab.toUpperCase(), cx, cy + 155);
  });
  // barras de la semana
  if (periodo === 'semana') {
    const days = lastDays(entries, now);
    const mx = Math.max(1, ...days.map((d) => d.n));
    const by = 1730, bh = 230, bw = (W - P * 2 - 6 * 18) / 7;
    days.forEach((d, i) => {
      const hh = Math.max(6, (d.n / mx) * bh);
      x.fillStyle = d.hoy ? v('--wrhi') : v('--wrline');
      x.fillRect(P + i * (bw + 18), by - hh, bw, hh);
      x.fillStyle = v('--wrmute');
      x.font = '400 24px DM';
      x.textAlign = 'center';
      x.fillText(d.hoy ? 'HOY' : d.label, P + i * (bw + 18) + bw / 2, by + 40);
      x.textAlign = 'left';
    });
  }
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

$('#btn-share').onclick = async () => {
  const blob = await imagen();
  const file = new File([blob], 'mi-amargometro.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mi-amargometro.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Imagen descargada.');
};

// Si la pestaña queda abierta de un día al otro, refrescamos al volver.
document.addEventListener('visibilitychange', () => { if (!document.hidden) { load(); render(); } });
window.addEventListener('storage', (e) => { if (e.key === KEY) { load(); render(); } });

load();
render();

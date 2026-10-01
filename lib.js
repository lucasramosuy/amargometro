// Lógica pura del amargómetro. Sin DOM, sin red: se usa igual en el navegador y en los tests.
export const TIPOS = [
  { id: 'amargo', label: 'Amargo' },
  { id: 'dulce', label: 'Dulce' },
  { id: 'yuyos', label: 'Con yuyos' },
  { id: 'lavado', label: 'Lavado' },
];
export const ML_POR_MATE = 150; // estimación, se aclara en la UI
export const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const addDays = (t, n) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
};
export const hhmm = (t) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function normalize(raw) {
  // Acepta {entries:[...]} o un array; descarta lo inválido.
  const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.entries) ? raw.entries : [];
  const ids = new Set();
  const out = [];
  for (const e of list) {
    if (!e || typeof e.t !== 'number' || !isFinite(e.t)) continue;
    const k = TIPOS.some((x) => x.id === e.k) ? e.k : 'amargo';
    let id = typeof e.id === 'string' && e.id ? e.id : `${e.t}-${out.length}`;
    while (ids.has(id)) id += 'b';
    ids.add(id);
    out.push({ id, t: e.t, k });
  }
  return out.sort((a, b) => a.t - b.t);
}

export function countsByDay(entries) {
  const m = new Map();
  for (const e of entries) m.set(dayKey(e.t), (m.get(dayKey(e.t)) || 0) + 1);
  return m;
}

export function lastDays(entries, now, n = 7) {
  const c = countsByDay(entries);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const t = addDays(startOfDay(now), -i);
    out.push({ t, key: dayKey(t), label: DIAS[new Date(t).getDay()], n: c.get(dayKey(t)) || 0, hoy: i === 0 });
  }
  return out;
}

// Racha: días seguidos con al menos un mate. Si hoy todavía no hay, cuenta desde ayer.
export function racha(entries, now) {
  const c = countsByDay(entries);
  let t = startOfDay(now);
  if (!c.get(dayKey(t))) t = addDays(t, -1);
  let n = 0;
  while (c.get(dayKey(t))) {
    n++;
    t = addDays(t, -1);
  }
  return n;
}

export function periodo(entries, now, que) {
  if (que === 'todo') return entries.slice();
  const dias = que === 'mes' ? 30 : 7;
  const desde = addDays(startOfDay(now), -(dias - 1));
  return entries.filter((e) => e.t >= desde);
}

export function franja(h) {
  if (h < 6) return 'madrugada';
  if (h < 12) return 'mañana';
  if (h < 15) return 'mediodía';
  if (h < 20) return 'tarde';
  return 'noche';
}

export function stats(entries, now, que) {
  const list = periodo(entries, now, que);
  const n = list.length;
  const horas = new Array(24).fill(0);
  const tipos = {};
  for (const e of list) {
    horas[new Date(e.t).getHours()]++;
    tipos[e.k] = (tipos[e.k] || 0) + 1;
  }
  const horaPico = n ? horas.indexOf(Math.max(...horas)) : null;
  const tipoTop = n ? Object.entries(tipos).sort((a, b) => b[1] - a[1])[0][0] : null;
  const c = countsByDay(list);
  const diasConMate = c.size;
  const maxDia = n ? Math.max(...c.values()) : 0;
  let span = que === 'mes' ? 30 : 7;
  if (que === 'todo') span = n ? Math.max(1, Math.round((startOfDay(now) - startOfDay(list[0].t)) / 864e5) + 1) : 1;
  return {
    n,
    litros: (n * ML_POR_MATE) / 1000,
    horaPico,
    franja: horaPico === null ? null : franja(horaPico),
    tipoTop,
    diasConMate,
    promedio: n / span,
    maxDia,
    racha: racha(entries, now),
  };
}

export function titulo(s) {
  if (!s.n) return { a: 'Todavía no cebaste nada.', b: 'Arrancá y volvé.' };
  const f = s.franja;
  const hh = `${pad(s.horaPico)}:00`;
  const frases = {
    madrugada: ['Sos de las ', 'Dormir es opcional.'],
    mañana: ['Sos de las ', 'Sin el de la mañana no arrancás.'],
    mediodía: ['Sos de las ', 'El mate es tu sobremesa.'],
    tarde: ['Sos de las ', 'Sin el mate de la tarde no arrancás.'],
    noche: ['Sos de las ', 'El mate de noche no perdona.'],
  };
  return { a: frases[f][0], hora: hh, b: frases[f][1] };
}

export function perfil(s) {
  if (!s.n) return '';
  if (s.promedio >= 12) return 'Termo a cuestas';
  if (s.promedio >= 7) return 'Mateador de ley';
  if (s.promedio >= 3) return 'Mateador constante';
  return 'Mateador de ocasión';
}

export function fmtLitros(l) {
  return l.toLocaleString('es-UY', { minimumFractionDigits: l < 10 ? 1 : 0, maximumFractionDigits: 1 });
}

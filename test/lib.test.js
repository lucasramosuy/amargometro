import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, racha, stats, lastDays, franja, dayKey } from '../lib.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0).getTime();
const E = (t, k = 'amargo') => ({ id: String(t), t, k });
const now = at(2026, 9, 30, 20);

test('normalize descarta basura y arregla tipos', () => {
  const r = normalize({ entries: [{ t: 5, k: 'raro' }, { t: 'x' }, null, { t: 3, k: 'dulce', id: 'a' }] });
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((e) => e.k), ['dulce', 'amargo']);
  assert.deepEqual(normalize('nada'), []);
});

test('normalize deduplica ids', () => {
  const r = normalize([{ t: 1, id: 'a' }, { t: 2, id: 'a' }]);
  assert.notEqual(r[0].id, r[1].id);
});

test('racha cuenta desde ayer si hoy está vacío', () => {
  const es = [E(at(2026, 9, 29)), E(at(2026, 9, 28)), E(at(2026, 9, 26))];
  assert.equal(racha(es, now), 2);
  assert.equal(racha([E(at(2026, 9, 30)), ...es], now), 3);
  assert.equal(racha([], now), 0);
});

test('stats semana: hora pico, tipo y litros', () => {
  const es = [E(at(2026, 9, 30, 17)), E(at(2026, 9, 30, 17), 'dulce'), E(at(2026, 9, 29, 17)), E(at(2026, 9, 1, 9))];
  const s = stats(es, now, 'semana');
  assert.equal(s.n, 3);
  assert.equal(s.horaPico, 17);
  assert.equal(s.franja, 'tarde');
  assert.equal(s.tipoTop, 'amargo');
  assert.equal(s.litros, 0.45);
  assert.equal(stats(es, now, 'todo').n, 4);
});

test('lastDays devuelve 7 días terminando hoy', () => {
  const d = lastDays([E(at(2026, 9, 30))], now);
  assert.equal(d.length, 7);
  assert.equal(d[6].hoy, true);
  assert.equal(d[6].n, 1);
  assert.equal(d[6].key, dayKey(now));
});

test('franja', () => {
  assert.deepEqual([3, 8, 13, 17, 22].map(franja), ['madrugada', 'mañana', 'mediodía', 'tarde', 'noche']);
});

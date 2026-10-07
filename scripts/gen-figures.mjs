// Generates the hairline isometric figures used as "video thumbnails" and the banner.
// Usage: node scripts/gen-figures.mjs   (writes assets/figs/*.svg)
import { writeFileSync, mkdirSync } from 'node:fs';

const C = Math.cos(Math.PI / 6), S = 0.5;
const P = (x, y, z = 0) => [(x - y) * C, (x + y) * S - z];

class Fig {
  constructor() { this.ops = []; }
  poly(pts, cls, closed = true) { this.ops.push({ t: 'p', pts, cls, closed }); }
  text(o, ex, ey, str, size, cls = 'tx') { this.ops.push({ t: 't', o, ex, ey, str, size, cls }); }
  box(x, y, z, w, d, h, o = {}) {
    const b = { x, y, z, w, d, h };
    const tone = o.tone || '';
    this.poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'ft ln ' + tone);
    this.poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'fl ln ' + tone);
    this.poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], 'fr ln ' + tone);
    // mappers onto each visible face: (u,v) -> screen
    b.L = (u, v) => P(x + u, y + d, z + h - v);
    b.R = (u, v) => P(x + w, y + d - u, z + h - v);
    b.T = (u, v) => P(x + u, y + v, z + h);
    return b;
  }
  line(m, pts, cls = 'soft') { this.poly(pts.map(([u, v]) => m(u, v)), 'ln ' + cls, false); }
  rect(m, u, v, w, h, cls = 'soft') { this.poly([[u, v], [u + w, v], [u + w, v + h], [u, v + h]].map(([a, b]) => m(a, b)), 'ln ' + cls); }
  circle(m, u, v, r, cls = 'soft', n = 20) {
    const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(m(u + r * Math.cos(a), v + r * Math.sin(a))); }
    this.poly(pts, 'ln ' + cls);
  }
  face_text(m, u, v, str, size, cls = 'tx') {
    const o = m(u, v), a = m(u + 1, v), b = m(u, v + 1);
    this.text(o, [a[0] - o[0], a[1] - o[1]], [b[0] - o[0], b[1] - o[1]], str, size, cls);
  }
  floor(cx, cy, n, step, cls = 'faint') {
    const h = (n * step) / 2;
    for (let i = 0; i <= n; i++) {
      this.poly([P(cx - h + i * step, cy - h), P(cx - h + i * step, cy + h)], 'ln ' + cls, false);
      this.poly([P(cx - h, cy - h + i * step), P(cx + h, cy - h + i * step)], 'ln ' + cls, false);
    }
  }
  svg(W, H, pad = 0.1, align = 'center') {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const op of this.ops) if (op.t === 'p' && !op.cls.includes('faint')) for (const [x, y] of op.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const s = Math.min((W * (1 - 2 * pad)) / (x1 - x0), (H * (1 - 2 * pad)) / (y1 - y0));
    const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - (y1 - y0) * s) / 2 - y0 * s;
    const f = n => Math.round(n * 100) / 100;
    const T = ([x, y]) => [x * s + ox, y * s + oy];
    let out = `<svg xmlns="http://www.w3.org/2000/svg" class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">`;
    for (const op of this.ops) {
      if (op.t === 'p') out += `<path class="${op.cls.trim()}" d="${op.pts.map((p, i) => (i ? 'L' : 'M') + T(p).map(f).join(' ')).join('')}${op.closed ? 'Z' : ''}"/>`;
      else { const o = T(op.o); out += `<text class="${op.cls}" transform="matrix(${[op.ex[0] * s, op.ex[1] * s, op.ey[0] * s, op.ey[1] * s, o[0], o[1]].map(f).join(' ')})" font-size="${op.size}">${op.str.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`; }
    }
    return out + '</svg>';
  }
}

// ---- thumbnails (16:9) ----
const figs = {};

// vigia — live chat moderation: a chat screen, a filter gate, a flagged message
figs['vigia'] = (() => {
  const f = new Fig(); f.floor(60, 40, 10, 10);
  const scr = f.box(20, 30, 0, 70, 6, 56);
  f.rect(scr.L, 5, 5, 60, 46, 'soft');
  [[8, 8, 40], [8, 18, 28], [8, 28, 46], [8, 38, 22]].forEach(([u, v, w], i) => {
    f.circle(scr.L, u + 1.5, v + 2, 1.6, 'soft', 10);
    f.line(scr.L, [[u + 6, v + 2], [u + 6 + w, v + 2]], i === 2 ? 'accent' : 'soft');
  });
  f.line(scr.L, [[8 + 6, 28 + 2], [8 + 6 + 46, 28 + 2]], 'accent');
  const gate = f.box(70, 50, 0, 6, 26, 40, { tone: 'ghost' });
  f.rect(gate.R, 3, 4, 20, 32, 'soft');
  f.box(95, 64, 0, 14, 14, 14);
  return f;
})();

// lazy-c7n — terminal UI: a flat monitor with panes and a selected row
figs['lazy-c7n'] = (() => {
  const f = new Fig(); f.floor(60, 50, 10, 10);
  f.box(46, 56, 0, 30, 16, 4);
  f.box(56, 62, 4, 10, 6, 12);
  const m = f.box(30, 40, 16, 62, 6, 50);
  f.rect(m.L, 4, 4, 54, 38, 'soft');
  f.line(m.L, [[22, 4], [22, 42]]);
  [[8, 8], [8, 15], [8, 22], [8, 29]].forEach(([u, v], i) => f.line(m.L, [[u, v], [u + 10, v]], i === 1 ? 'accent' : 'soft'));
  [[26, 8, 24], [26, 15, 18], [26, 22, 26], [26, 29, 14]].forEach(([u, v, w]) => f.line(m.L, [[u, v], [u + w, v]]));
  f.face_text(m.L, 6, 40.5, '> custodian run', 3.2);
  return f;
})();

// comfytosh — beige machine: tower, CRT, keyboard and swatches
figs['comfytosh'] = (() => {
  const f = new Fig(); f.floor(60, 50, 10, 10);
  f.box(40, 48, 0, 52, 30, 5, { tone: 'ghost' }); // desk pad
  const body = f.box(46, 44, 5, 40, 34, 34);
  f.rect(body.L, 5, 4, 30, 20, 'soft');
  f.line(body.L, [[5, 29], [35, 29]]);
  f.rect(body.L, 26, 26, 8, 3, 'soft');
  const crt = f.box(52, 52, 39, 28, 22, 22);
  f.rect(crt.L, 3, 3, 22, 14, 'accent');
  f.rect(crt.L, 3, 3, 22, 14, 'soft');
  f.box(52, 82, 5, 28, 10, 2);
  [0, 1, 2, 3, 4].forEach(i => f.box(104 + (i % 3) * 8 - 0, 56 + Math.floor(i / 3) * 8, 5, 6, 6, 3));
  return f;
})();

// isometric-illustrations — stacked cubes and a ghost wireframe
figs['isometric-illustrations'] = (() => {
  const f = new Fig(); f.floor(60, 50, 10, 10);
  f.box(30, 30, 0, 30, 30, 10, { tone: 'ghost' });
  f.box(30, 30, 0, 30, 30, 10);
  f.box(40, 40, 10, 20, 20, 10);
  f.box(46, 46, 20, 14, 14, 10);
  f.box(70, 36, 0, 14, 14, 14);
  f.box(70, 64, 0, 14, 14, 24);
  f.box(84, 64, 0, 14, 14, 36);
  f.box(98, 64, 0, 14, 14, 48);
  return f;
})();

// pnpm hardening skill — a package with a padlock and sealed lids
figs['pnpm-supply-chain-hardening-skill'] = (() => {
  const f = new Fig(); f.floor(60, 50, 10, 10);
  const pk = f.box(34, 38, 0, 44, 36, 34);
  f.line(pk.T, [[0, 18], [44, 18]]);
  f.line(pk.L, [[22, 0], [22, 34]]);
  // padlock on the left face
  f.rect(pk.L, 14, 14, 16, 12, 'accent');
  f.poly([[8, 14], [8, 8], [12, 4], [18, 4], [22, 8], [22, 14]].map(([u, v]) => pk.L(u + 7, v + 0)), 'ln accent', false);
  f.circle(pk.L, 22, 20, 1.6, 'accent', 10);
  f.box(86, 44, 0, 14, 14, 12, { tone: 'ghost' });
  f.box(86, 70, 0, 14, 14, 12, { tone: 'ghost' });
  f.box(20, 80, 0, 14, 14, 12, { tone: 'ghost' });
  return f;
})();

// ---- wide banner (≈ 6:1): the projects in a row, each on its own tile ----
figs.banner = (() => {
  const f = new Fig();
  const items = [
    (x, y) => { f.box(x - 15, y - 3, 0, 30, 6, 44); f.box(x + 6, y - 3, 0, 6, 6, 18, { tone: 'ghost' }); },      // vigia
    (x, y) => { f.box(x - 14, y - 8, 0, 28, 6, 36); f.box(x - 8, y + 2, 0, 16, 8, 4); },                           // terminal
    (x, y) => { f.box(x - 14, y - 12, 0, 28, 24, 6); f.box(x - 10, y - 8, 6, 20, 16, 14); f.box(x - 6, y - 6, 20, 12, 10, 8); }, // machine
    (x, y) => { f.box(x - 15, y - 15, 0, 30, 30, 8); f.box(x - 9, y - 9, 8, 18, 18, 8); f.box(x - 4, y - 4, 16, 8, 8, 8); },    // stacked
    (x, y) => { f.box(x - 14, y - 10, 0, 28, 20, 20); f.rect(f.box(x - 6, y - 4, 20, 12, 8, 6, { tone: 'ghost' }).L, 2, 1.5, 8, 3, 'accent'); }, // package
  ];
  const step = 52;
  items.forEach((fn, i) => {
    const s = (i - (items.length - 1) / 2) * step;   // slide along the screen-horizontal axis (x up, y down)
    const cx = 100 + s, cy = 100 - s;
    const t = 26;
    f.poly([P(cx - t, cy - t), P(cx + t, cy - t), P(cx + t, cy + t), P(cx - t, cy + t)], 'ln soft');
    f.poly([P(cx - t + 6, cy - t + 6), P(cx + t - 6, cy - t + 6), P(cx + t - 6, cy + t - 6), P(cx - t + 6, cy + t - 6)], 'ln faint');
    fn(cx, cy);
  });
  return f;
})();

mkdirSync('assets/figs', { recursive: true });
for (const [name, fig] of Object.entries(figs)) {
  const svg = name === 'banner' ? fig.svg(1200, 200, 0.06) : fig.svg(320, 180, 0.12);
  writeFileSync(`assets/figs/${name}.svg`, svg);
  console.log('wrote', name, svg.length);
}

/* Terminal effects, no dependencies: boot screen, rain, dividers, decode,
   typewriter, git clone progress, titled code frames. Everything respects
   prefers-reduced-motion and the page reads fine without any of it. */
(() => {
  "use strict";
  const doc = document.documentElement;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const rand = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hash = (a, b, c) => {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // Width of one monospace cell inside el.
  const cell = (el) => {
    const s = document.createElement("span");
    s.textContent = "0".repeat(20);
    s.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
    el.appendChild(s);
    const w = s.getBoundingClientRect().width / 20;
    s.remove();
    return w || 9;
  };
  const colsOf = (el) => Math.floor(el.clientWidth / cell(el));
  // A loop that stops itself when draw returns false, and idles in background tabs.
  const loop = (draw, fps = 30) => {
    let t0 = 0, last = 0, id = 0;
    const tick = (now) => {
      if (!t0) t0 = now;
      if (now - last >= 1000 / fps - 2) {
        last = now;
        if (draw((now - t0) / 1000) === false) return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  };
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
  };

  /* ── boot ─────────────────────────────────────────────────────────────
     A short self test, the kernel scrolling by, services coming up, then a
     login typed at the prompt. About four seconds; any key or tap skips. */
  function boot() {
    if (!doc.classList.contains("boot")) return;
    const W = 58;
    const row = (l, d, s = "") => { const a = l.padEnd(10) + d; return a + s.padStart(W - a.length); };
    const SPIN = "|/-\\";
    const ent = [];
    let at = 0.1;
    const put = (x, gap = 0.035) => { ent.push({ at, f: typeof x === "string" ? () => x : x }); at += gap; };
    const MEM = 16384, M0 = 0.35, MT = 0.9;
    const mem = (n) => Math.min(1, Math.max(0, (n - M0) / MT));
    const probe = (l, d, s, done) => (n) => n >= done ? row(l, d, s) : row(l, "detecting " + SPIN[Math.floor(n * 12) % 4]);
    put(row("lofi bios 2.31", "", "self test"));
    put("─".repeat(W));
    put(row("cpu", "4 cores, 8 threads at 2.40 GHz", "ok"));
    put((n) => row("memory", String(Math.floor(mem(n) * MEM)).padStart(5) + " MB of " + MEM + " MB", mem(n) < 1 ? "testing" : "ok"));
    put((n) => {
      const f = mem(n), full = Math.floor(f * 28), part = " ▏▎▍▌▋▊▉"[Math.floor((f * 28 - full) * 8)];
      return " ".repeat(10) + "<bar>" + ("█".repeat(full) + (full < 28 ? part : "")).padEnd(28, "░") + "</bar>  " + (Math.floor(f * 100) + "%").padStart(4);
    });
    put(probe("storage", "sata 0: 512 GB", "ok", 0.8));
    put(probe("network", "1 port, 1000 Mb/s", "link up", 1.15));
    put("─".repeat(W));
    at = M0 + MT + 0.15;
    put("", 0.05);
    put("booting from disk 0 ...", 0.18);
    const K = ["kernel 6.8.0 starting on 8 cpus", "command line: root=/dev/sda2 ro quiet", "memory: 16384 MB available",
      "smp: brought up 1 node, 8 cpus", "pci: probing bus 0000:00", "usb 1-1: new high speed device", "sda: sda1 sda2",
      "eth0: link up, 1000 Mb/s, full duplex", "ext4: mounted sda2", "init: running /sbin/init"];
    const r = rand(7);
    let stamp = 0;
    K.forEach((k, i) => { stamp += i ? 0.02 + r() * 0.09 : 0; put("[" + stamp.toFixed(6).padStart(12) + "] " + k, 0.04); });
    const S = ["mounted root file system", "started journal service", "started device manager", "~clock not synced, using hardware time",
      "reached target network", "started secure shell server", "reached target multi-user system"];
    at += 0.15;
    for (const s of S) put(s[0] === "~" ? "[ WARN ] " + s.slice(1) : "[  OK  ] " + s, 0.07 + r() * 0.06);
    at += 0.25;
    put("", 0.1);
    // the same names the prompt uses: user@computer, or lowkey@lofison on a phone
    const [who, host] = matchMedia("(max-width: 640px)").matches ? ["lowkey", "lofison"] : ["user", "computer"];
    const login = at;
    put((n) => host + " login: " + who.slice(0, Math.floor((n - login) / 0.11)), who.length * 0.11 + 0.25);
    put("password: ", 0.45);
    const last = new Date().toString().split(" ").slice(0, 5).join(" ").toLowerCase();
    put("last login: " + last + " on tty1", 0.25);
    const end = at + 0.35;

    const paint = (line) => esc(line)
      .replace(/&lt;bar&gt;(.*?)&lt;\/bar&gt;/, '<span class="bar">$1</span>')
      .replace(/^\[  OK  \]/, '[<span class="ok">  OK  </span>]')
      .replace(/^\[ WARN \]/, '[<span class="warn"> WARN </span>]')
      .replace(/^(\[ *[\d.]+\])/, '<span class="ts">$1</span>')
      .replace(/^(lofi bios.*)$/, '<span class="hd">$1</span>')
      .replace(/ (ok|link up)$/, ' <span class="ok">$1</span>');

    const box = document.createElement("div");
    box.className = "bootlog";
    box.setAttribute("aria-hidden", "true");
    const pre = document.createElement("pre");
    const hint = document.createElement("span");
    hint.className = "hint";
    hint.textContent = "esc · skip";
    box.append(pre, hint);
    document.body.appendChild(box);
    const fit = () => box.style.setProperty("--fs", Math.min(13, (innerWidth - 32) / (W + 1) / 0.6) + "px");
    fit();
    const rows = () => Math.max(6, Math.floor((innerHeight - 40) / (parseFloat(getComputedStyle(pre).fontSize) * 1.5)));

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      stop();
      store.set("booted", "1");
      doc.classList.remove("boot");
      box.classList.add("out");
      setTimeout(() => box.remove(), 500);
      removeEventListener("keydown", finish);
    };
    const stop = loop((t) => {
      const lines = ent.filter((e) => e.at <= t).map((e) => e.f(t));
      if (!lines.length) lines.push("");
      lines[lines.length - 1] += (t % 0.9 < 0.5 || t < login + 1.5) ? "█" : " ";
      const n = rows();
      pre.innerHTML = lines.slice(-n).map(paint).join("\n").replace(/█$/, '<span class="cur">█</span>');
      if (t >= end) { finish(); return false; }
    }, 30);
    box.addEventListener("pointerdown", finish);
    addEventListener("keydown", finish);
  }

  /* ── rain ─────────────────────────────────────────────────────────────
     Near streams in even columns, far ones in odd; glyphs get lighter down
     the tail. Drawn at a few percent so it reads as texture, not motion. */
  function rain() {
    if (still) return;
    const cv = document.createElement("canvas");
    cv.className = "rain";
    cv.setAttribute("aria-hidden", "true");
    document.body.prepend(cv);
    const ctx = cv.getContext("2d");
    const FS = 14, CW = FS * 0.62, LH = FS * 1.25;
    const NEAR = { v: [5, 5], len: [10, 10], gap: [0.3, 0.8], a: 0.04 };
    const FAR = { v: [2.2, 1.6], len: [8, 6], gap: [1.2, 1.6], a: 0.022 };
    const HEAD = "@#%&$", BODY = "0123456789ABCDEFHKMNPRSTXZacdeghkmnorsuvxz", THIN = ["=+*<>:;!|", ":;!|il^~", ".,'`"];
    let cols = 0, rows = 0, lanes = [], dpr = 1;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      cols = Math.ceil(innerWidth / CW);
      rows = Math.ceil(innerHeight / LH);
      lanes = Array.from({ length: cols }, (_, c) => {
        const k = c % 2 ? FAR : NEAR;
        return { k, v: k.v[0] + hash(c, 1, 0) * k.v[1], ph: hash(c, 3, 0) * rows * 3, pass: 0, from: 0 };
      });
    };
    const len = (c, p, k) => k.len[0] + Math.floor(hash(c, p, 4) * k.len[1]);
    const span = (c, p, k) => rows + len(c, p, k) + rows * (k.gap[0] + hash(c, p, 2) * k.gap[1]);
    size();
    addEventListener("resize", size);
    loop((t) => {
      if (document.hidden) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.font = FS + "px 'Geist Mono', monospace";
      ctx.textBaseline = "top";
      const tick = Math.floor(t * 12);
      for (let c = 0; c < cols; c++) {
        const L = lanes[c], k = L.k, u = L.ph + t * L.v;
        for (let s; u - L.from >= (s = span(c, L.pass, k)); L.pass++) L.from += s;
        const head = Math.floor(u - L.from), n = len(c, L.pass, k);
        for (let d = 0; d < n; d++) {
          const r = head - d;
          if (r < 0) break;
          if (r >= rows) continue;
          const f = d / n;
          if (f > 0.5 && hash(c, r, L.pass * 31 + 7) < ((f - 0.5) / 0.5) ** 2 * 0.8) continue;
          const set = d === 0 && k === NEAR ? HEAD : f < 0.45 ? BODY : THIN[f < 0.7 ? 0 : f < 0.86 ? 1 : 2];
          const when = d === 0 ? tick : Math.floor((t + hash(c, r, 5) * 9) * (0.3 + hash(c, r, 6)));
          const a = k.a * (d === 0 ? 1.5 : 1 - f * 0.8);
          ctx.fillStyle = d === 0 ? `rgba(214,232,200,${a})` : `rgba(214,232,200,${a * 0.8})`;
          ctx.fillText(set[Math.floor(hash(c, r, when) * set.length)], c * CW, r * LH);
        }
      }
    }, 12);
  }

  /* ── dividers ─────────────────────────────────────────────────────────
     Between blocks: · · ─ ─ ────━━━━━━━━────── ─ ─ · ·, sized to the column,
     never wider than 59 cells. */
  function dividers() {
    const make = (n) => {
      const h = Math.floor(n / 2);
      if (h < 12) return "─".repeat(n);
      const run = h - 8, thin = Math.ceil(run * 0.45);
      const half = "· · ─ ─ " + "─".repeat(thin) + "<b>" + "━".repeat(run - thin);
      return half + (n % 2 ? "━" : "") + [...half.replace("<b>", "")].reverse().join("").replace(/^(━*)/, "$1</b>");
    };
    const rules = $$(".blk+.blk").map((b) => {
      const d = document.createElement("div");
      d.className = "rule";
      d.setAttribute("aria-hidden", "true");
      b.before(d);
      return d;
    });
    const draw = () => rules.forEach((d) => (d.innerHTML = make(Math.min(59, colsOf(d)))));
    draw();
    let id;
    addEventListener("resize", () => { clearTimeout(id); id = setTimeout(draw, 120); });
  }

  /* ── decode ───────────────────────────────────────────────────────────
     Text resolves left to right out of flickering glyphs. Spaces and
     length stay put, so nothing reflows while it runs. */
  const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@0123456789abcdefxyz";
  function decode(el, opts = {}) {
    const to = opts.to ?? el.textContent, from = opts.from ?? to;
    if (still) { el.textContent = to; return Promise.resolve(); }
    if (el._decoding) el._decoding();
    const n = Math.max(from.length, to.length), r = rand(to.length * 31 + 7);
    const lead = opts.lead ?? 0.18, step = opts.step ?? 0.035;
    const out = [], settle = [];
    for (let i = 0; i < n; i++) { out.push(i * 0.012 + r() * 0.04); settle.push(lead + i * step + r() * 0.1); }
    if (!el.hasAttribute("aria-label") && opts.label !== false) el.setAttribute("aria-label", to);
    return new Promise((res) => {
      const stop = loop((t) => {
        const tick = Math.floor(t * 24);
        let s = "";
        for (let i = 0; i < n; i++) {
          const a = from[i] ?? " ", b = to[i] ?? " ";
          if (t < out[i]) s += a;
          else if (t >= settle[i]) s += b;
          else if (b === " " || b === "\n") s += b;
          else s += GLYPHS[Math.floor(hash(i, tick, 9) * GLYPHS.length)];
        }
        el.textContent = s;
        if (t >= settle[n - 1]) { el.textContent = to; el._decoding = null; res(); return false; }
      }, 30);
      el._decoding = () => { stop(); el.textContent = to; el._decoding = null; res(); };
    });
  }
  function decodes() {
    $$("h1.title").forEach((el) => decode(el, { label: false }));
    // command arguments decode the first time they scroll into view
    const io = "IntersectionObserver" in window && new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { io.unobserve(e.target); decode(e.target, { label: false, step: 0.025 }); }
    }), { rootMargin: "0px 0px -10% 0px" });
    if (io) $$(".blk>h1 .arg,.blk>h2 .arg,.cmdline .arg").forEach((el) => io.observe(el));
    // nav links scramble again on hover
    $$("nav.main a").forEach((a) => {
      const t = a.textContent;
      a.addEventListener("mouseenter", () => decode(a, { to: t, lead: 0.08, step: 0.03, label: false }));
    });
    // 404: cycles through its phrases, each decoding out of the one before
    $$(".lost[data-phrases]").forEach((el) => {
      const ps = JSON.parse(el.dataset.phrases);
      el.setAttribute("aria-label", ps[0]);
      let i = 0;
      const next = () => {
        const from = ps[i], to = ps[(i = (i + 1) % ps.length)];
        const w = Math.max(from.length, to.length);
        decode(el, { from: from.padEnd(w), to: to.padEnd(w), label: false, step: 0.05, lead: 0.3 }).then(() => setTimeout(next, 1900));
      };
      if (!still) setTimeout(next, 1900);
    });
  }

  /* ── typewriter ───────────────────────────────────────────────────────
     Types a phrase, holds it, backspaces it, types the next. Now and then a
     neighbouring key slips in and gets corrected. */
  function typer() {
    const ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];
    const slip = (ch, r) => {
      for (const row of ROWS) {
        const i = row.indexOf(ch);
        if (i >= 0) return row[i === 0 ? 1 : i === row.length - 1 ? i - 1 : i + (r() < 0.5 ? -1 : 1)];
      }
      return null;
    };
    $$(".typer[data-phrases]").forEach((el) => {
      const tw = el.querySelector(".tw"), list = JSON.parse(el.dataset.phrases);
      // screen readers get the whole list once instead of keystrokes
      const all = document.createElement("span");
      all.className = "vh";
      all.textContent = list.join(" · ");
      tw.after(all);
      tw.setAttribute("aria-hidden", "true");
      if (still || !list.length) { el.classList.add("idle"); return; }
      const r = rand(31), ev = [];
      let at = 0, text = list[0];
      const key = (s, w) => { at += w; text = s; ev.push([at, s]); };
      const delay = (ch) => 0.06 + r() * 0.09 + (ch === " " ? 0.05 + r() * 0.08 : 0) + (r() < 0.05 ? 0.3 : 0);
      const erase = () => { const n = text.length; for (let k = 0; k < n; k++) key(text.slice(0, -1), k === 0 ? 0 : k === 1 ? 0.18 : 0.045); at += 0.5; };
      at = 2.6; // the first phrase is already on screen; hold it, then start
      erase();
      list.slice(1).concat(list[0]).forEach((p) => {
        const typo = r() < 0.5 && p.length > 5 ? 3 + Math.floor(r() * (p.length - 4)) : -1;
        for (let i = 0; i < p.length; i++) {
          const wrong = i === typo ? slip(p[i], r) : null;
          if (wrong) { key(text + wrong, delay(p[i])); at += 0.25 + r() * 0.2; key(text.slice(0, -1), 0.1); }
          key(text + p[i], delay(p[i]) + (i && ".,!?".includes(p[i - 1]) ? 0.15 : 0));
        }
        ev.push([at, text, "hold"]);
        at += 2.2;
        if (p !== list[0]) erase();
      });
      const period = at;
      let shown = null;
      loop((t) => {
        const now = t % period;
        let s = list[0], idle = true, lastAt = 0;
        for (const [w, x] of ev) { if (w > now) break; s = x; lastAt = w; }
        idle = now - lastAt > 0.45;
        if (s !== shown) tw.textContent = shown = s;
        el.classList.toggle("idle", idle);
      }, 30);
    });
  }

  /* ── git clone progress ───────────────────────────────────────────────
     Five bars in five styles, each surging and stalling on its own, then a
     closing line. Plays once, when it comes into view. */
  function progress() {
    $$("pre.progress").forEach((pre) => {
      pre.hidden = false;
      const labels = JSON.parse(pre.dataset.labels || "[]");
      const EIGHTHS = " ▏▎▍▌▋▊▉";
      const styles = [
        (p, W) => { const n = Math.floor(p * (W - 2)); return "[" + "=".repeat(n) + (n < W - 2 ? ">" + " ".repeat(W - 3 - n) : "") + "]"; },
        (p, W) => { const e = Math.round(p * (W - 2) * 8), n = e >> 3; return "▕" + "█".repeat(n) + (n < W - 2 ? EIGHTHS[e & 7] + " ".repeat(W - 3 - n) : "") + "▏"; },
        (p, W) => { const n = Math.floor(p * (W - 2)); return "[" + "#".repeat(n) + ".".repeat(W - 2 - n) + "]"; },
        (p, W) => { const L = Math.floor(W / 2), n = Math.floor(p * L + 1e-9); return ("█ ".repeat(n) + "░ ".repeat(L - n)).slice(0, W); },
        (p, W) => { const h = Math.floor(p * W * 2), n = h >> 1; return "━".repeat(n) + (n < W ? (h & 1 ? "╾" : "─") + "─".repeat(W - 1 - n) : ""); },
      ];
      const ease = (x) => x * x * (3 - 2 * x);
      const bars = labels.map((label, i) => {
        const r = rand(i * 7919 + 17), legs = 3 + Math.floor(r() * 3), dt = [], dv = [];
        for (let j = 0; j < legs; j++) { dt.push(0.5 + r()); dv.push(0.2 + r()); }
        const st = dt.reduce((a, b) => a + b), sv = dv.reduce((a, b) => a + b), kn = [[0, 0]];
        let u = 0, v = 0;
        for (let j = 0; j < legs; j++) kn.push([(u += dt[j] / st), (v += dv[j] / sv)]);
        kn[legs] = [1, 1];
        return { label, draw: styles[i % styles.length], start: i * 0.35 + r() * 0.2, dur: [2.1, 1.7, 2.6, 1.9, 2.2][i % 5], kn };
      });
      const prog = (b, t) => {
        const x = (t - b.start) / b.dur;
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let j = 1;
        while (b.kn[j][0] < x) j++;
        const [u0, v0] = b.kn[j - 1], [u1, v1] = b.kn[j];
        return v0 + (v1 - v0) * ease((x - u0) / (u1 - u0));
      };
      const total = Math.max(...bars.map((b) => b.start + b.dur));
      const frame = (t) => {
        const W = Math.max(10, Math.min(28, colsOf(pre) - 16));
        const lines = bars.map((b) => {
          const p = prog(b, t), pct = (Math.floor(p * 100) + "%").padStart(4);
          return esc(b.label.slice(0, 9).padEnd(10)) + "<b>" + esc(b.draw(p, W)) + "</b> " + (p >= 1 ? '<span class="ok">' + pct + "</span>" : "<em>" + pct + "</em>");
        });
        lines.push(t >= total + 0.2 ? '<span class="ok">done.</span> ' + (total + 0.2).toFixed(1) + "s" : " ");
        pre.innerHTML = lines.join("\n");
      };
      let state = still ? "done" : "wait";
      frame(state === "done" ? 99 : 0);
      addEventListener("resize", () => state !== "run" && frame(state === "done" ? 99 : 0));
      if (still) return;
      const go = () => { state = "run"; loop((t) => { frame(t); if (t > total + 0.25) { state = "done"; return false; } }, 30); };
      if (!("IntersectionObserver" in window)) return go();
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { threshold: 0.4 });
      io.observe(pre);
    });
  }

  /* ── titled code frames: ─ go ─ set into the top edge ─────────────── */
  function frames() {
    $$(".highlight").forEach((h) => {
      const c = h.querySelector("code[data-lang]");
      if (c) h.dataset.lang = c.dataset.lang;
    });
  }

  const run = (f) => { try { f(); } catch (e) { console.error(e); } };
  const start = () => [boot, rain, dividers, frames, decodes, typer, progress].forEach(run);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

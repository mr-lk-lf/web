/* BayerField, after VSGARD: an 8x8 Bayer-dithered wave gradient on a canvas. */
(function () {
  var c = document.getElementById('bayer');
  var ctx = c && c.getContext('2d');
  if (!ctx) return;
  var B = (function () {
    var m = [[0, 2], [3, 1]], q = [[0, 2], [3, 1]], n = 2;
    while (n < 8) {
      var e = [];
      for (var y = 0; y < n * 2; y++) { e[y] = []; for (var x = 0; x < n * 2; x++) e[y][x] = 4 * m[y % n][x % n] + q[Math.floor(y / n)][Math.floor(x / n)]; }
      m = e; n *= 2;
    }
    return m;
  })();
  var CELL = 3, t = 1.3, img = null, w = 0, h = 0, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw() {
    var nw = Math.max(1, Math.ceil(c.clientWidth / CELL)), nh = Math.max(1, Math.ceil(c.clientHeight / CELL));
    if (nw !== w || nh !== h || !img) { w = c.width = nw; h = c.height = nh; img = ctx.createImageData(w, h); }
    var p = img.data, rgb = (getComputedStyle(c).color.match(/[\d.]+/g) || [216, 214, 207]).map(Number);
    for (var y = 0; y < h; y++) {
      var ny = y / h;
      for (var x = 0; x < w; x++) {
        var nx = x / w, o = (y * w + x) * 4;
        var v = (1 - (nx * 0.55 + ny * 0.45)) * (0.35 + 0.9 * (0.5 + 0.5 * Math.sin(nx * 6 + t * 0.9) * Math.cos(ny * 5 - t * 0.7)));
        if (v > (B[y & 7][x & 7] + 0.5) / 64) { p[o] = rgb[0]; p[o + 1] = rgb[1]; p[o + 2] = rgb[2]; p[o + 3] = 255; } else p[o + 3] = 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  draw();
  addEventListener('resize', draw);
  if (!still) setInterval(function () { if (!document.hidden) { t += 0.09; draw(); } }, 90);
})();

/* MarbleField, after VSGARD: domain-warped fbm noise, ordered-dithered into chunky blocks. */
(function () {
  var c = document.getElementById('marble');
  var ctx = c && c.getContext('2d');
  if (!ctx) return;
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  var BLOCK = 5, SPEED = 1, SCALE = 1, CONTRAST = 2.1, WARP = 3.8;
  function hash(ix, iy) { var h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263); h = Math.imul(h ^ h >>> 13, 1274126177); return (h >>> 0) / 4294967296; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function noise(x, y) {
    var ix = Math.floor(x) | 0, iy = Math.floor(y) | 0, fx = x - ix, fy = y - iy, ux = sm(fx), uy = sm(fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), cc = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (cc - a) * uy + (a - b - cc + d) * ux * uy;
  }
  function fbm(x, y, o) { var v = 0, amp = .5, fr = 1, n = 0; for (var i = 0; i < o; i++) { v += amp * noise(x * fr, y * fr); n += amp; amp *= .5; fr *= 2.07; } return v / n; }
  var img, ow = 0, oh = 0, frame = 0, rgb = [216, 214, 207], still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw() {
    if (!img) return;
    var d = img.data, t = frame * .003 * SPEED, s = SCALE * .016 * (BLOCK / 5);
    for (var y = 0; y < oh; y++) {
      var py = y * s;
      for (var x = 0; x < ow; x++) {
        var px = x * s, q0 = fbm(px + t, py, 3), q1 = fbm(px + 5.2, py + 1.3 + t * .6, 3);
        var v = fbm(px + WARP * q0 + 1.7, py + WARP * q1 + 9.2, 4);
        v = Math.min(v * v * CONTRAST, 1);
        var i = (y * ow + x) * 4;
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
        d[i + 3] = v > (BAYER[y & 3][x & 3] + .5) / 16 ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function size() {
    ow = Math.max(1, Math.ceil(c.clientWidth / BLOCK)); oh = Math.max(1, Math.ceil(c.clientHeight / BLOCK));
    c.width = ow; c.height = oh; img = ctx.createImageData(ow, oh);
    rgb = (getComputedStyle(c).color.match(/[\d.]+/g) || rgb).map(Number);
    draw();
  }
  size();
  addEventListener('resize', size);
  if (!still) setInterval(function () { if (!document.hidden) { frame++; draw(); } }, 66);
})();

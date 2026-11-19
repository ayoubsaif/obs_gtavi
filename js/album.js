/*
 * Auto "album" background: a canvas slideshow that cycles through config.album
 * with slow Ken Burns drift and rotating transitions (cross-zoom, neon wipe,
 * blinds, iris, slide-push).
 *
 * Usage: <canvas class="album" data-album></canvas>  (replaces the static .bg). Load fx.js first.
 */
(function () {
  const C = (window.Overlay && Overlay.config) || window.OVERLAY_CONFIG || {};
  const cv = document.querySelector("canvas[data-album]");
  if (!cv) return;
  const asset = (window.Overlay && Overlay.asset) || (p => p);
  const list = C.album && C.album.length ? C.album : [asset(cv.dataset.fallback)].filter(Boolean);
  const HOLD = (C.albumSeconds || 7) * 1000;     // time each photo stays
  const TRANS = 1800;                            // transition length
  const W = 1920, H = 1080;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

  const imgs = list.map(src => { const i = new Image(); i.src = src; return i; });
  const ready = i => i.complete && i.naturalWidth > 0;

  const { ease, EFFECTS } = window.OverlayFx;   // fx.js (shared with stingers.html)

  // Ken Burns: each slide gets its own drift direction
  const drift = imgs.map((_, i) => ({ dx: [1, -1, .6, -.6, 0][i % 5], dy: [.4, -.3, -.5, .5, .3][i % 5], z0: 1.04 + (i % 2) * .04 }));

  function drawSlide(i, life, extraScale = 1, offX = 0) {
    const img = imgs[i]; if (!ready(img)) { ctx.fillStyle = "#12081f"; ctx.fillRect(0, 0, W, H); return; }
    const d = drift[i], k = Math.min(1, life / (HOLD + TRANS));
    const z = (d.z0 + 0.08 * k) * extraScale;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * z;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    const px = d.dx * 40 * (k - .5), py = d.dy * 30 * (k - .5);
    ctx.drawImage(img, (W - w) / 2 + px + offX, (H - h) / 2 + py, w, h);
  }

  let cur = 0, start = performance.now(), fx = 0;

  function frame() {
    const now = performance.now(), t = now - start;
    const n = imgs.length;
    if (n < 2 || t < HOLD) {
      drawSlide(cur, t);
    } else {
      const p = ease(Math.min(1, (t - HOLD) / TRANS)), nxt = (cur + 1) % n, nt = t - HOLD;
      const effect = EFFECTS[fx % EFFECTS.length];
      transition(effect, p, cur, t, nxt, nt);
      if (t >= HOLD + TRANS) { cur = nxt; start = now - TRANS; fx++; }  // next slide keeps its drift time
    }
    schedule();
  }

  function transition(effect, p, a, at, b, bt) {
    OverlayFx.draw(ctx, effect, p, (sc, off) => drawSlide(a, at, sc, off), (sc, off) => drawSlide(b, bt, sc, off), W, H);
  }

  function schedule() {
    let fired = false;
    const run = () => { if (!fired) { fired = true; frame(); } };
    requestAnimationFrame(run); setTimeout(run, 50);   // fallback if rAF is throttled
  }

  const first = imgs[0];
  if (ready(first)) schedule(); else { first.onload = schedule; first.onerror = schedule; }
})();

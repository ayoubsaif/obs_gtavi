/*
 * Auto "album" background: a canvas slideshow that cycles through config.album
 * with slow Ken Burns drift and rotating transitions (cross-zoom, neon wipe,
 * blinds, iris, slide-push).
 *
 * Usage: <canvas class="album" data-album></canvas>  (replaces the static .bg)
 */
(function () {
  const C = (window.Overlay && Overlay.config) || window.OVERLAY_CONFIG || {};
  const cv = document.querySelector("canvas[data-album]");
  if (!cv) return;
  const list = C.album && C.album.length ? C.album : [cv.dataset.fallback].filter(Boolean);
  const HOLD = (C.albumSeconds || 7) * 1000;     // time each photo stays
  const TRANS = 1800;                            // transition length
  const W = 1920, H = 1080;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

  const imgs = list.map(src => { const i = new Image(); i.src = src; return i; });
  const ready = i => i.complete && i.naturalWidth > 0;

  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const EFFECTS = ["crosszoom", "wipe", "blinds", "iris", "push"];

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
    switch (effect) {
      case "crosszoom":
        drawSlide(a, at, 1 + .15 * p);
        ctx.globalAlpha = p; drawSlide(b, bt, 1.25 - .25 * p); ctx.globalAlpha = 1;
        break;

      case "wipe": { // diagonal wipe with glowing sunset edge
        drawSlide(a, at);
        const x = -400 + (W + 800) * p, slant = 300;
        ctx.save(); ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(x + slant, 0); ctx.lineTo(x - slant, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.clip(); drawSlide(b, bt); ctx.restore();
        const g = ctx.createLinearGradient(x + slant, 0, x - slant, H);
        g.addColorStop(0, "#ffb15e"); g.addColorStop(.5, "#ff4fa3"); g.addColorStop(1, "#6b4fe0");
        ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.shadowColor = "#ff4fa3"; ctx.shadowBlur = 40;
        ctx.beginPath(); ctx.moveTo(x + slant, 0); ctx.lineTo(x - slant, H); ctx.stroke(); ctx.restore();
        break;
      }

      case "blinds": { // vertical slices drop in, staggered
        drawSlide(a, at);
        const N = 10, sw = W / N;
        for (let i = 0; i < N; i++) {
          const q = Math.max(0, Math.min(1, p * 1.6 - i * .06));
          if (q <= 0) continue;
          ctx.save(); ctx.beginPath(); ctx.rect(i * sw, 0, sw + 1, H * q); ctx.clip();
          drawSlide(b, bt); ctx.restore();
        }
        break;
      }

      case "iris": { // circle opens from center with a neon ring
        drawSlide(a, at, 1 + .05 * p);
        const r = p * Math.hypot(W, H) * .55;
        ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.clip(); drawSlide(b, bt); ctx.restore();
        ctx.save(); ctx.strokeStyle = "rgba(63,242,255,.9)"; ctx.lineWidth = 6; ctx.shadowColor = "#3ff2ff"; ctx.shadowBlur = 30;
        ctx.globalAlpha = 1 - p * .6; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        break;
      }

      case "push": // new photo pushes the old one off to the left
        drawSlide(a, at, 1, -W * p * .6);
        ctx.fillStyle = `rgba(18,8,31,${.5 * p})`; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.beginPath(); ctx.rect(W * (1 - p), 0, W * p + 1, H); ctx.clip();
        drawSlide(b, bt, 1, W * (1 - p) * .4); ctx.restore();
        break;
    }
  }

  function schedule() {
    let fired = false;
    const run = () => { if (!fired) { fired = true; frame(); } };
    requestAnimationFrame(run); setTimeout(run, 50);   // fallback if rAF is throttled
  }

  const first = imgs[0];
  if (ready(first)) schedule(); else { first.onload = schedule; first.onerror = schedule; }
})();

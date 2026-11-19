/*
 * Shared transition effects (cross-zoom, neon wipe, blinds, iris, slide-push).
 * Used by album.js (photo slideshow in "Empezamos en breve") and stingers.html
 * (renders the same effects as OBS stinger videos), so both always look the same.
 *
 * OverlayFx.draw(ctx, effect, p, drawA, drawB, W, H)
 *   p: eased progress 0..1 (use OverlayFx.ease)
 *   drawA / drawB(scale = 1, offX = 0): paint the outgoing / incoming picture
 */
(function (g) {
  const EFFECTS = ["crosszoom", "wipe", "blinds", "iris", "push"];
  const NAMES = { crosszoom: "Zoom cruzado", wipe: "Barrido neón", blinds: "Persianas", iris: "Iris", push: "Empuje" };
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  function draw(ctx, effect, p, drawA, drawB, W, H) {
    switch (effect) {
      case "crosszoom":
        drawA(1 + .15 * p);
        ctx.globalAlpha = p; drawB(1.25 - .25 * p); ctx.globalAlpha = 1;
        break;

      case "wipe": { // diagonal wipe with glowing sunset edge
        drawA();
        const x = -400 + (W + 800) * p, slant = 300;
        ctx.save(); ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(x + slant, 0); ctx.lineTo(x - slant, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.clip(); drawB(); ctx.restore();
        const gr = ctx.createLinearGradient(x + slant, 0, x - slant, H);
        gr.addColorStop(0, "#ffb15e"); gr.addColorStop(.5, "#ff4fa3"); gr.addColorStop(1, "#6b4fe0");
        ctx.save(); ctx.strokeStyle = gr; ctx.lineWidth = 10; ctx.shadowColor = "#ff4fa3"; ctx.shadowBlur = 40;
        ctx.beginPath(); ctx.moveTo(x + slant, 0); ctx.lineTo(x - slant, H); ctx.stroke(); ctx.restore();
        break;
      }

      case "blinds": { // vertical slices drop in, staggered
        drawA();
        const N = 10, sw = W / N;
        for (let i = 0; i < N; i++) {
          const q = Math.max(0, Math.min(1, p * 1.6 - i * .06));
          if (q <= 0) continue;
          ctx.save(); ctx.beginPath(); ctx.rect(i * sw, 0, sw + 1, H * q); ctx.clip();
          drawB(); ctx.restore();
        }
        break;
      }

      case "iris": { // circle opens from center with a neon ring
        drawA(1 + .05 * p);
        const r = p * Math.hypot(W, H) * .55;
        ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.clip(); drawB(); ctx.restore();
        ctx.save(); ctx.strokeStyle = "rgba(63,242,255,.9)"; ctx.lineWidth = 6; ctx.shadowColor = "#3ff2ff"; ctx.shadowBlur = 30;
        ctx.globalAlpha = 1 - p * .6; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        break;
      }

      case "push": // new picture pushes the old one off to the left
        drawA(1, -W * p * .6);
        ctx.fillStyle = `rgba(18,8,31,${.5 * p})`; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.beginPath(); ctx.rect(W * (1 - p), 0, W * p + 1, H); ctx.clip();
        drawB(1, W * (1 - p) * .4); ctx.restore();
        break;
    }
  }

  g.OverlayFx = { EFFECTS, NAMES, ease, draw };
})(typeof window !== "undefined" ? window : globalThis);

/*
 * Canvas hero intro — time-driven take on the "art behind the title" hero:
 *   1. Art is seen only THROUGH the title letters, zooming out from huge to fit.
 *   2. The full art blooms in around the title.
 *   3. Art scales down + sinks into a dark violet veil while the title holds…
 *   4. …then the veil lifts to reveal the live HTML scene underneath.
 *
 * Usage: <body data-intro-img="../assets/x.jpg" data-intro-title="BE RIGHT|BACK">
 * Skip with ?intro=0. In OBS tick "Refresh browser when scene becomes active"
 * so it replays every time you switch to the scene.
 */
(function () {
  const q = new URLSearchParams(location.search);
  const body = document.body;
  const src = body.dataset.introImg;
  if (!src || q.get("intro") === "0") { body.classList.add("intro-done"); return; }

  const lines = (body.dataset.introTitle || "").split("|");
  const W = 1920, H = 1080, DUR = 4.2;            // seconds
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.style.cssText = "position:fixed;inset:0;width:1920px;height:1080px;z-index:9999;pointer-events:none";
  body.appendChild(cv);
  const ctx = cv.getContext("2d");

  // Offscreen layer for the masked title
  const mk = document.createElement("canvas"); mk.width = W; mk.height = H;
  const m = mk.getContext("2d");

  const img = new Image();
  img.src = src;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = x => 1 - Math.pow(1 - x, 4);
  const easeInOut = x => x < .5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2;

  function cover(c, scale, alpha) {
    const s = Math.max(W / img.width, H / img.height) * scale;
    const w = img.width * s, h = img.height * s;
    c.globalAlpha = alpha;
    c.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    c.globalAlpha = 1;
  }

  function titlePath(c, scale) {
    const size = 170;
    c.save();
    c.translate(W / 2, H / 2); c.scale(scale, scale);
    c.font = `500 ${size}px "GTA Art Deco", Anton, Impact, sans-serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    const lh = size * 0.92, top = -((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => c.fillText(l.toUpperCase(), 0, top + i * lh));
    c.restore();
  }

  function bgGrad(alpha) {
    const g = ctx.createLinearGradient(0, 0, W * .4, H);
    g.addColorStop(0, `rgba(34,26,66,${alpha})`);
    g.addColorStop(1, `rgba(14,10,28,${alpha})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  let t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    // Phase timings
    const zoom   = easeOut(seg(t, 0.0, 1.8));     // title zooms out to fit
    const bloom  = easeInOut(seg(t, 1.5, 2.4));   // full art fades in around title
    const sink   = easeInOut(seg(t, 2.6, 3.5));   // art scales down + darkens
    const reveal = easeInOut(seg(t, 3.4, DUR));   // whole canvas lifts

    // Base veil
    bgGrad(1);

    // Full art behind (bloom in, then sink away like the scroll-out)
    const artScale = 1.12 - 0.04 * bloom - 0.1 * sink;
    cover(ctx, artScale, bloom * (1 - 0.85 * sink));

    // Darkening veil during sink
    if (sink > 0) { ctx.fillStyle = `rgba(16,10,32,${0.65 * sink})`; ctx.fillRect(0, 0, W, H); }

    // Title: art clipped to the letters, zooming from huge
    const tScale = 9 - 8 * zoom - 0.06 * sink;
    m.clearRect(0, 0, W, H);
    m.globalCompositeOperation = "source-over";
    titlePath(m, tScale);
    m.globalCompositeOperation = "source-in";
    // inside letters: the art (slightly larger so it drifts) + a sunset tint once it's in front of the art
    const s = Math.max(W / img.width, H / img.height) * (1.25 - 0.1 * zoom);
    const iw = img.width * s, ih = img.height * s;
    m.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    const tint = m.createLinearGradient(0, H * .3, 0, H * .7);
    tint.addColorStop(0, "#ffb15e"); tint.addColorStop(.5, "#ff4fa3"); tint.addColorStop(1, "#6b4fe0");
    m.globalAlpha = 0.85 * bloom; m.fillStyle = tint; m.fillRect(0, 0, W, H); m.globalAlpha = 1;
    m.globalCompositeOperation = "source-over";

    ctx.save();
    ctx.shadowColor = `rgba(255,79,163,${0.6 * bloom})`; ctx.shadowBlur = 50;
    ctx.globalAlpha = 1 - sink * 0.6;
    ctx.drawImage(mk, 0, 0);
    ctx.restore();

    // Lift everything
    cv.style.opacity = String(1 - reveal);
    if (reveal > 0.35 && !body.classList.contains("intro-done")) body.classList.add("intro-done");

    if (t < DUR) next();
    else { cv.remove(); body.classList.add("intro-done"); }
  }

  // rAF normally; setTimeout fallback for hidden/throttled sources so the intro can never get stuck
  function next() {
    let fired = false;
    const run = () => { if (!fired) { fired = true; frame(performance.now()); } };
    requestAnimationFrame(run); setTimeout(run, 50);
  }
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.load('500 170px "GTA Art Deco"').then(() => document.fonts.ready) : Promise.resolve(),
    new Promise(r => setTimeout(r, 1500))
  ]);
  const start = () => fontsReady.then(next);
  if (img.complete && img.naturalWidth) start(); else { img.onload = start; img.onerror = () => { cv.remove(); body.classList.add("intro-done"); }; }
})();

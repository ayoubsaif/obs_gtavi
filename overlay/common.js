(function () {
  const C = window.OVERLAY_CONFIG || {};
  const q = new URLSearchParams(location.search);

  const ICONS = {
    prime:   '<svg viewBox="0 0 24 24"><path d="M2 6.5 7.2 10 12 3l4.8 7L22 6.5 19.8 17H4.2L2 6.5ZM4.5 18.5h15V21h-15v-2.5Z"/></svg>',   // Prime Gaming crown
    twitch:  '<svg viewBox="0 0 24 24"><path d="M4 2 2.5 6v14h5v3h3l3-3h4l5-5V2H4Zm16 12-3 3h-4.5l-3 3v-3H5.5V4H20v10ZM16 7.5h2v6h-2v-6Zm-5 0h2v6h-2v-6Z"/></svg>',
    x:       '<svg viewBox="0 0 24 24"><path d="M17.8 2.5h3.3l-7.2 8.2 8.5 10.8h-6.6l-5.2-6.7-6 6.7H1.3l7.7-8.7L.9 2.5h6.8l4.7 6.1 5.4-6.1Zm-1.2 17h1.8L6.7 4.3H4.7l11.9 15.2Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z"/></svg>',
    discord: '<svg viewBox="0 0 24 24"><path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18a19.8 19.8 0 0 0 6 3l1.3-2-2-1 .5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.8 19.8 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.1C4.3 2.2 2.2 4.3 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.1 3.6 2.2 5.7 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.6-.1 5.7-2.2 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.1-3.6-2.2-5.7-5.8-5.8C15 2 14.7 2 12 2Z"/></svg>',
    tiktok:  '<svg viewBox="0 0 24 24"><path d="M16.6 2h-3.4v13.5a2.9 2.9 0 1 1-2-2.8V9.3a6.3 6.3 0 1 0 5.4 6.2V8.7a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7Z"/></svg>'
  };

  const pad = n => String(n).padStart(2, "0");
  const fmt = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s % 60); };

  // Game/category: the one set on Twitch (written by twitch.js, shared by every scene through localStorage),
  // falling back to config.game while offline or with no category set.
  const GAME_KEY = "gta6-overlay.game.v1";
  const cachedGame = () => { try { return localStorage.getItem(GAME_KEY) || ""; } catch (e) { return ""; } };
  const showGame = () => document.querySelectorAll("[data-game]").forEach(el => el.textContent = cachedGame() || C.game || "");
  function setGame(name) {
    try { name ? localStorage.setItem(GAME_KEY, name) : localStorage.removeItem(GAME_KEY); } catch (e) {}
    showGame();   // "storage" only fires in the OTHER pages
  }
  addEventListener("storage", e => { if (e.key === GAME_KEY) showGame(); });

  function fill() {
    document.querySelectorAll("[data-channel]").forEach(el => el.textContent = q.get("channel") || C.channel || "");
    showGame();
    document.querySelectorAll("[data-next]").forEach(el => el.textContent = C.nextStream || "");

    const bar = document.querySelector(".socials");
    if (bar) {
      if (!C.socials || !C.socials.length || q.get("socials") === "0") bar.remove();
      else bar.innerHTML = C.socials.map(s =>
        `<div class="social">${ICONS[s.icon] || ""}<span>${s.handle}</span></div>`).join("");
    }

    // Support line (Twitch subs / bits)
    const SP = C.support || {};
    document.querySelectorAll("[data-support-line]").forEach(el => el.textContent = SP.line || "");
    document.querySelectorAll("[data-support-note]").forEach(el => el.textContent = SP.note || "");

    document.querySelectorAll(".ticker-track").forEach(t => {
      const msgs = C.tickerMessages || [];
      const html = msgs.map(m => `<span>${m}</span>`).join("");
      t.innerHTML = html + html; // doubled for seamless loop
    });
  }

  // Scale the 1920x1080 stage to fit whatever size the window / OBS source is (letterboxed, centred)
  function fit() {
    const b = document.body; if (!b) return;
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    b.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
    document.documentElement.classList.toggle("has-scene", !!document.querySelector(".scene"));
  }
  fit(); addEventListener("resize", fit); document.addEventListener("DOMContentLoaded", fit);

  window.Overlay = { config: C, query: q, fmt, pad, ICONS, setGame };
  document.addEventListener("DOMContentLoaded", fill);
})();

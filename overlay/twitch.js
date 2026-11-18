/*
 * Twitch data for the overlay: sub goal, last 5 subs, and live alerts (subs, resubs, gifts, bits).
 *
 *  - Without credentials it uses the values in config.js (subs.goal / subs.lastSubs).
 *  - With config.twitch.clientId + token it connects to Twitch EventSub (WebSocket) and
 *    updates live; on load the last-subs list is filled with real subscribers from Helix
 *    (replacing the config.js examples). Needed token scopes: channel:read:subscriptions bits:read channel:read:goals
 *  - The last-subs list and goal are cached in localStorage, so every scene shows the same data
 *    and it survives OBS restarts.
 *
 *  API:  Overlay.twitch.on("alert", fn)   fn({ kind: "sub"|"resub"|"gift"|"cheer", name, tier, months, count, bits, message })
 *        Overlay.twitch.on("update", fn)  fn(state)
 *        Overlay.twitch.state            { goal: {title,current,target}, lastSubs: [{name, months, tier, gift}] }
 */
(function () {
  const C = Overlay.config, S = C.subs || {}, T = C.twitch || {};
  const KEY = "gta6-overlay.subs.v1";
  const handlers = { alert: [], update: [] };
  const emit = (type, data) => handlers[type].forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });

  // ---------- state ----------
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const cached = load();
  const state = {
    goal: (cached && cached.goal) || (S.goal ? { ...S.goal } : null),
    lastSubs: (cached && cached.lastSubs) || (S.lastSubs || []).slice(0, 5)
  };
  if (Overlay.query.get("reset") === "1") { state.goal = S.goal ? { ...S.goal } : null; state.lastSubs = (S.lastSubs || []).slice(0, 5); save(); }

  let liveGoal = false;
  function addSub(s) {   // only called for real subs received while the overlay runs
    state.lastSubs = [{ ...s, live: true }, ...state.lastSubs.filter(x => x.name !== s.name)].slice(0, 5);
  }
  function changed() { save(); render(); emit("update", state); }

  // other scenes (same OBS profile) update instantly
  addEventListener("storage", e => {
    if (e.key !== KEY) return;
    const n = load(); if (!n) return;
    state.goal = n.goal; state.lastSubs = n.lastSubs; render(); emit("update", state);
  });

  // ---------- rendering (any page) ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tierLabel = t => t === "3000" ? "Nivel 3" : t === "2000" ? "Nivel 2" : "Sub";
  const subTag = s => s.gift ? "Regalo" : s.months > 1 ? `${s.months} meses` : tierLabel(s.tier);

  function render() {
    document.querySelectorAll(".goal").forEach(g => {
      const G = state.goal;
      if (!G || !G.target) { g.style.display = "none"; return; }
      g.style.display = "";
      const pct = Math.min(100, 100 * (G.current || 0) / G.target);
      if (!g.querySelector(".goal-bar")) {
        g.innerHTML = `<div class="goal-head"><span></span><b></b></div><div class="goal-bar"><i></i></div>`;
      }
      g.querySelector(".goal-head span").textContent = G.title || "Objetivo de subs";
      g.querySelector(".goal-head b").textContent = `${G.current || 0} / ${G.target} subs`;
      setTimeout(() => g.querySelector("i").style.width = pct + "%", 400);
    });
    document.querySelectorAll(".last-subs").forEach(r => {
      const list = state.lastSubs.slice(0, 5);
      r.innerHTML = `<div class="ls-head">Últimos subs</div>` + (list.length
        ? list.map(s => `<div><span>${esc(s.name)}</span><b>${esc(subTag(s))}</b></div>`).join("")
        : `<div class="ls-empty">${(Overlay.ICONS && Overlay.ICONS.prime) || ""}<span>¡Sé el primero en suscribirte!</span></div>`);
    });
    const last = state.lastSubs[0];
    document.querySelectorAll("[data-last-sub]").forEach(el => el.textContent = last ? last.name : "—");
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", render) : render();

  // ---------- normalised events (from EventSub, StreamElements or tests) ----------
  function handle(ev) {
    if (ev.kind === "sub" || ev.kind === "resub") {
      addSub({ name: ev.name, months: ev.months || 1, tier: ev.tier || "1000", gift: !!ev.gift });
      if (!liveGoal && state.goal && ev.kind === "sub") state.goal.current = (state.goal.current || 0) + 1;
      changed();
    } else if (ev.kind === "gift") {
      if (!liveGoal && state.goal) state.goal.current = (state.goal.current || 0) + (ev.count || 1);
      changed();
    }
    if (!ev.silent) emit("alert", ev);
  }

  // ---------- Twitch EventSub over WebSocket ----------
  const HELIX = "https://api.twitch.tv/helix";
  let userId = null, retry = 0;

  async function api(path, opts = {}) {
    const r = await fetch(HELIX + path, { ...opts, headers: {
      "Client-Id": T.clientId, "Authorization": "Bearer " + T.token, "Content-Type": "application/json", ...(opts.headers || {}) } });
    if (!r.ok) throw new Error(path + " → HTTP " + r.status);
    return r.status === 204 ? null : r.json();
  }

  async function startLive() {
    try {
      const v = await fetch("https://id.twitch.tv/oauth2/validate", { headers: { Authorization: "OAuth " + T.token } });
      if (!v.ok) throw new Error("token no válido o caducado");
      userId = (await v.json()).user_id;
      await Promise.all([loadGoal(), loadSubs()]);
      connect("wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30", true);
    } catch (e) { console.warn("[twitch] modo sin conexión:", e.message); }
  }

  async function loadGoal() {
    try {
      const g = await api(`/goals?broadcaster_id=${userId}`);
      const sg = (g.data || []).find(x => /sub/.test(x.type));
      if (sg) applyGoal(sg.description, sg.current_amount, sg.target_amount);
    } catch (e) { console.warn("[twitch] goals:", e.message); }
  }
  // Replace the config.js examples with real subscribers. Helix gives no sub dates, so subs received
  // live (marked `live`) stay first and the rest is filled in Twitch's order, skipping the broadcaster.
  async function loadSubs() {
    try {
      const r = await api(`/subscriptions?broadcaster_id=${userId}&first=100`);
      const live = state.lastSubs.filter(s => s.live);
      const seen = new Set(live.map(s => s.name.toLowerCase()));
      const fill = (r.data || [])
        .filter(s => s.user_id !== userId && !seen.has(s.user_name.toLowerCase()))
        .map(s => ({ name: s.user_name, tier: s.tier, gift: s.is_gift }));
      state.lastSubs = [...live, ...fill].slice(0, 5);
      changed();
    } catch (e) { console.warn("[twitch] subs:", e.message); }
  }
  function applyGoal(title, current, target) {
    liveGoal = true;
    state.goal = { title: title || (state.goal && state.goal.title) || "Objetivo de subs", current, target };
    changed();
  }

  const SUBS = [
    ["channel.subscribe", "1"], ["channel.subscription.message", "1"], ["channel.subscription.gift", "1"],
    ["channel.cheer", "1"], ["channel.goal.begin", "1"], ["channel.goal.progress", "1"], ["channel.goal.end", "1"]
  ];

  function connect(url, subscribe) {
    const ws = new WebSocket(url);
    let keepaliveTimer = null, closedOnPurpose = false;
    const arm = s => { clearTimeout(keepaliveTimer); keepaliveTimer = setTimeout(() => ws.close(), (s + 10) * 1000); };

    ws.onmessage = async msg => {
      const m = JSON.parse(msg.data), type = m.metadata && m.metadata.message_type;
      if (type === "session_welcome") {
        retry = 0; arm(m.payload.session.keepalive_timeout_seconds || 30);
        if (subscribe) for (const [t, ver] of SUBS) {
          api("/eventsub/subscriptions", { method: "POST", body: JSON.stringify({
            type: t, version: ver, condition: { broadcaster_user_id: userId },
            transport: { method: "websocket", session_id: m.payload.session.id } }) })
            .catch(e => console.warn("[twitch] suscripción " + t + ":", e.message));
        }
      } else if (type === "session_keepalive") { arm(30); }
      else if (type === "session_reconnect") {          // Twitch moves us: open the new socket, keep subscriptions
        closedOnPurpose = true; connect(m.payload.session.reconnect_url, false); ws.close();
      } else if (type === "notification") { arm(30); onNotification(m.payload.subscription.type, m.payload.event); }
    };
    ws.onclose = () => {
      clearTimeout(keepaliveTimer);
      if (closedOnPurpose) return;
      setTimeout(() => connect("wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30", true), Math.min(60, 2 ** retry++) * 1000);
    };
  }

  function onNotification(type, e) {
    switch (type) {
      case "channel.subscribe":     // new subs (also each gifted recipient)
        handle({ kind: "sub", name: e.user_name, tier: e.tier, gift: e.is_gift, silent: e.is_gift }); break;
      case "channel.subscription.message":
        handle({ kind: "resub", name: e.user_name, tier: e.tier, months: e.cumulative_months, message: e.message && e.message.text }); break;
      case "channel.subscription.gift":
        handle({ kind: "gift", name: e.is_anonymous ? "Anónimo" : e.user_name, tier: e.tier, count: e.total }); break;
      case "channel.cheer":
        handle({ kind: "cheer", name: e.is_anonymous ? "Anónimo" : e.user_name, bits: e.bits, message: e.message }); break;
      case "channel.goal.begin": case "channel.goal.progress":
        if (/sub/.test(e.type)) applyGoal(e.description, e.current_amount, e.target_amount); break;
      case "channel.goal.end":
        if (/sub/.test(e.type)) applyGoal(e.description, e.current_amount, e.target_amount); break;
    }
  }

  // ---------- StreamElements custom-widget events (optional alternative) ----------
  addEventListener("onEventReceived", ev => {
    const d = ev.detail || {}, e = d.event || {};
    if (d.listener === "subscriber-latest") {
      if (e.bulkGifted) handle({ kind: "gift", name: e.sender || e.name, count: e.amount });
      else handle({ kind: (e.amount || 1) > 1 ? "resub" : "sub", name: e.name, months: e.amount, tier: e.tier, message: e.message, gift: e.gifted, silent: e.gifted && e.isCommunityGift });
    } else if (d.listener === "cheer-latest") handle({ kind: "cheer", name: e.name, bits: e.amount, message: e.message });
  });

  // ---------- manual alerts from the OBS dock (control.html → obs-websocket → obs-browser "emit_event") ----------
  // Every browser source receives the event; only a page that shows alerts (alerts.html) records it,
  // the other scenes get the new list/goal through localStorage, so a sub is counted once.
  addEventListener("gta6-alert", ev => {
    const d = ev.detail || {};
    if (!/^(sub|resub|gift|cheer)$/.test(d.kind)) return;
    const a = { kind: d.kind, name: String(d.name || "Anónimo").slice(0, 40), tier: d.tier || "1000",
                months: +d.months || 1, count: +d.count || 1, bits: +d.bits || 0,
                message: d.message ? String(d.message).slice(0, 300) : "" };
    if (!handlers.alert.length) return;
    d.record ? handle(a) : emit("alert", a);
  });

  Overlay.twitch = { state, on: (t, fn) => handlers[t] && handlers[t].push(fn), simulate: handle, live: !!(T.clientId && T.token) };
  if (T.clientId && T.token) startLive();
})();

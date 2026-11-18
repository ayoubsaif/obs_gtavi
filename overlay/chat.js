/*
 * Chat de Twitch en solo lectura (IRC por WebSocket, anónimo: no necesita token).
 * Se monta en el primer elemento con [data-chat].
 * Parámetros: ?test=1 mensajes de prueba · ?preview=1 fondo de juego · ?channel=otro_canal
 * Config opcional en config.js -> chat: { hideAfter: 0, maxMessages: 14, hideBots: [...], hideCommands: true }
 */
(function () {
  const { config, query } = Overlay;
  const box = document.querySelector("[data-chat]");
  if (!box) return;
  const status = document.createElement("div");
  status.className = "status"; status.textContent = "Conectando al chat…"; box.appendChild(status);
  const CH = (query.get("channel") || config.channel || "").toLowerCase().replace(/^#/, "");
  const CFG = Object.assign({ hideAfter: 0, maxMessages: 14, hideBots: ["nightbot", "streamelements", "streamlabs", "moobot", "fossabot"], hideCommands: true }, config.chat || {});

  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PALETTE = ["#ff4fa3", "#ffb15e", "#3ff2ff", "#a98bff", "#7dffb2", "#ff7a7a", "#ffd86b"];
  const fallbackColor = n => PALETTE[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

  // Twitch name colours can be too dark on our background: lift them
  function readable(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
    let [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16));
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum < 0.5) { const k = 0.5 / Math.max(lum, 0.05); [r, g, b] = [r, g, b].map(v => Math.min(255, Math.round(v * k + 40))); }
    return `rgb(${r},${g},${b})`;
  }

  // Global badge images (public CDN)
  const BADGES = {
    broadcaster: "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2",
    moderator:   "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2",
    vip:         "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2",
    subscriber:  "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2",
    premium:     "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2"
  };

  function renderText(text, emotesTag) {
    // emotes tag: "25:0-4,12-16/1902:6-10"
    const ranges = [];
    if (emotesTag) emotesTag.split("/").forEach(e => {
      const [id, pos] = e.split(":"); if (!pos) return;
      pos.split(",").forEach(p => { const [a, b] = p.split("-").map(Number); ranges.push({ a, b, id }); });
    });
    ranges.sort((x, y) => x.a - y.a);
    const chars = [...text]; let out = "", i = 0;
    for (const r of ranges) {
      out += esc(chars.slice(i, r.a).join(""));
      out += `<img class="emote" alt="" src="https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/default/dark/2.0">`;
      i = r.b + 1;
    }
    return out + esc(chars.slice(i).join(""));
  }

  function add({ name, color, badges = "", text, emotes, action, highlight }) {
    if (status.parentNode) status.remove();
    const el = document.createElement("div");
    el.className = "msg" + (action ? " action" : "") + (highlight ? " highlight" : "");
    const badgeHtml = badges.split(",").map(b => b.split("/")[0]).filter(b => BADGES[b])
      .map(b => `<img class="badge" alt="" src="${BADGES[b]}">`).join("");
    const c = readable(color) || fallbackColor(name);
    el.style.borderLeftColor = c;
    el.innerHTML = `${badgeHtml}<span class="name" style="color:${c}">${esc(name)}</span><span class="text">${renderText(text, emotes)}</span>`;
    box.appendChild(el);
    box.dispatchEvent(new CustomEvent("chat:message", { detail: el }));
    while (box.children.length > CFG.maxMessages) box.firstElementChild.remove();
    if (CFG.hideAfter > 0) setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 700); }, CFG.hideAfter * 1000);
  }

  function removeBy(fn) { [...box.querySelectorAll(".msg")].filter(fn).forEach(el => el.remove()); }

  // ---------- IRC ----------
  function parse(line) {
    const m = { tags: {} };
    if (line[0] === "@") { const sp = line.indexOf(" "); line.slice(1, sp).split(";").forEach(t => { const [k, v = ""] = t.split("="); m.tags[k] = v.replace(/\\s/g, " ").replace(/\\:/g, ";").replace(/\\\\/g, "\\"); }); line = line.slice(sp + 1); }
    if (line[0] === ":") { const sp = line.indexOf(" "); m.prefix = line.slice(1, sp); line = line.slice(sp + 1); }
    const ti = line.indexOf(" :"); m.trailing = ti >= 0 ? line.slice(ti + 2) : "";
    const parts = (ti >= 0 ? line.slice(0, ti) : line).split(" "); m.command = parts[0]; m.params = parts.slice(1);
    return m;
  }

  let retry = 0;
  function connect() {
    if (!CH) { status.textContent = "Falta el canal en config.js"; return; }
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + Math.floor(10000 + Math.random() * 80000));
      ws.send("JOIN #" + CH);
    };
    ws.onmessage = ev => ev.data.split("\r\n").filter(Boolean).forEach(line => {
      const m = parse(line);
      if (m.command === "PING") return ws.send("PONG :" + m.trailing);
      if (m.command === "ROOMSTATE" || m.command === "366") { retry = 0; status.textContent = "Chat conectado · " + CH; }
      if (m.command === "PRIVMSG") {
        const login = (m.prefix || "").split("!")[0];
        if (CFG.hideBots.includes(login)) return;
        let text = m.trailing, action = false;
        if (text.startsWith("\u0001ACTION ")) { text = text.slice(8, -1); action = true; }
        if (CFG.hideCommands && text.startsWith("!")) return;
        add({ name: m.tags["display-name"] || login, color: m.tags.color, badges: m.tags.badges, text,
              emotes: m.tags.emotes, action, highlight: m.tags["msg-id"] === "highlighted-message" || !!m.tags.bits });
        box.lastElementChild.dataset.id = m.tags.id || ""; box.lastElementChild.dataset.user = m.tags["user-id"] || "";
      }
      if (m.command === "CLEARMSG") removeBy(el => el.dataset.id === m.tags["target-msg-id"]);
      if (m.command === "CLEARCHAT") m.tags["target-user-id"] ? removeBy(el => el.dataset.user === m.tags["target-user-id"]) : removeBy(() => true);
    });
    ws.onclose = () => { status.textContent = "Reconectando…"; setTimeout(connect, Math.min(30, 2 ** retry++) * 1000); };
  }

  if (query.get("test") === "1") {
    const demo = [
      { name: "Lucia_Fan", color: "#FF69B4", badges: "subscriber/6", text: "¡Por fin GTA VI en el canal! 🌴" },
      { name: "ViceCityVIP", color: "#1E90FF", badges: "vip/1", text: "Kappa ese coche no llega a la huida", emotes: "25:0-4" },
      { name: "el_chachocanario", color: "#9146FF", badges: "broadcaster/1", text: "Bienvenidos a Leonida, gente" },
      { name: "PalmeraNeon", color: "#000080", text: "qué ganas de ver Vice City de noche" },
      { name: "ModCanario", color: "#00FF7F", badges: "moderator/1", text: "Recordad: buen rollo en el chat" }
    ];
    let i = 0; const tick = () => add(demo[i++ % demo.length]); tick(); setInterval(tick, 1800);
  } else connect();
})();

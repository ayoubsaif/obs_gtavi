// ===== Valores por defecto (NO edites este archivo) =====
// Tus ajustes van en config.js; lo más fácil es abrir settings.html en Chrome/Edge.
// Todo lo que falte en config.js se toma de aquí, así que config.js puede tener solo lo que cambies.
window.OVERLAY_DEFAULTS = {
  channel: "el_chachocanario",
  game: "Grand Theft Auto VI",
  socials: [
    { icon: "twitch",    handle: "twitch.tv/el_chachocanario" }
  ],
  album: [
    "img/Jason_Lucia_Rooftop_landscape.jpg",
    "img/Jason_and_Lucia_Robbery_landscape.jpg",
    "img/Jason_and_Lucia_03.jpg",
    "img/Jason_and_Lucia_08.jpg",
    "img/Jason_and_Lucia_07.jpg"
  ],
  albumSeconds: 7,
  countdownTo: "00:00:00",
  countdownZone: "Europe/Madrid",
  startingMinutes: 5,
  nextStream: "Mañana por la mañana",
  support: {
    line: "Suscríbete gratis con Prime Gaming",
    note: "o anima el directo con bits en Twitch"
  },
  subs: {
    goal: { title: "Objetivo de subs", current: 0, target: 50 },
    bigGift: 5,
    bigBits: 1000,
    bigMonths: 12,
    alertScale: 0.43,
    alertSound: "assets/sounds/alert_sound.mp3",
    alertVolume: 0.8
  },
  chat: {
    idleHide: 25,
    hideAfter: 0,
    maxMessages: 14,
    hideCommands: true,
    hideBots: ["nightbot", "streamelements", "streamlabs", "moobot", "fossabot"]
  },
  twitch: { clientId: "", token: "" },
  obs: { host: "localhost", port: 4455, password: "" },
  tickerMessages: [
    "Bienvenidos a Leonida",
    "Si te mola el directo, dale a seguir"
  ]
};

// ===== Edita esto para personalizar todas las escenas =====
window.OVERLAY_CONFIG = {
  channel: "el_chachocanario",       // etiqueta de la webcam y pantallas
  game: "Grand Theft Auto VI",        // texto "Jugando a"
  socials: [                          // deja [] para ocultar la barra
    { icon: "twitch",    handle: "twitch.tv/el_chachocanario" },
    { icon: "x",         handle: "@elchachocanario" },
    { icon: "instagram", handle: "@el_chachocanario" },
    { icon: "tiktok",    handle: "@el_chachocanario" }
  ],
  album: [                           // fondo rotativo de "Empezamos en breve"
    "img/Jason_Lucia_Rooftop_landscape.jpg",
    "img/Jason_and_Lucia_Robbery_landscape.jpg",
    "img/Jason_and_Lucia_03.jpg",
    "img/Jason_and_Lucia_08.jpg",
    "img/Jason_and_Lucia_07.jpg"
  ],
  albumSeconds: 7,                    // segundos por foto
  countdownTo: "00:00:00",            // hora objetivo de la cuenta atrás (HH:MM:SS, o ?at=21:30:00)
  countdownZone: "Europe/Madrid",     // zona horaria del objetivo (independiente de la del PC)
  startingMinutes: 5,                 // solo si se usa ?minutes=10 (cuenta atrás de duración fija)
  nextStream: "Mañana por la mañana",      // se muestra en "Fin del directo"
  // Apoyo al canal: solo Twitch (subs, también gratis con Prime Gaming, y bits)
  support: {
    line: "Suscríbete gratis con Prime Gaming",
    note: "o anima el directo con bits en twitch.tv/el_chachocanario"
  },
  subs: {
    goal: { title: "Objetivo de subs", current: 12, target: 50 },  // si Twitch tiene un objetivo de subs activo, se usa ese
    lastSubs: [                       // ejemplos hasta conectar con Twitch (se guardan los 5 últimos)
      { name: "Lucia_Fan", months: 1 },
      { name: "ViceCityVIP", months: 6 },
      { name: "JasonDuval_ES", months: 1 },
      { name: "LeonidaKing", months: 3 },
      { name: "PalmeraNeon", months: 1 }
    ],
    bigGift: 5,                       // regalos de 5+ subs = alerta grande
    bigBits: 1000,                    // 1000+ bits = alerta grande
    bigMonths: 12,                    // resubs de 12+ meses = alerta grande
    alertScale: 0.43                  // tamaño de las alertas: 0.43 ≈ 20% del ancho de pantalla, 1 = tamaño original
  },
  // Conexión en directo con Twitch (opcional). Ver README. ⚠️ El token es privado: no compartas este archivo.
  twitch: {
    clientId: "lf0c9ttub2xos253b7cosk4b12b1f7",
    token: "kv06epfjy2snks6q1axwclaq068phg"
  },
  // Panel de alertas (control.html) → servidor WebSocket de OBS. También se puede poner en el propio panel.
  obs: {
    host: "localhost",
    port: 4455,
    password: ""
  },
  tickerMessages: [
    "Bienvenidos a Leonida",
    "Si te mola el directo, dale a seguir",
    "Buen rollo en el chat — aquí mandan las reglas de Vice City",
    "!comandos para todo lo demás"
  ]
};

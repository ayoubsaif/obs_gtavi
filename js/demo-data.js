// ===== Datos de ejemplo (no son ajustes) =====
// Se usan solo mientras no hay conexión con Twitch o en los modos de prueba (?test=1).
// Puedes cambiarlos sin miedo: no afectan a nada en directo.
window.OVERLAY_DEMO = {
  // "Últimos subs" hasta que Twitch dé los reales (se guardan los 5 últimos; ?reset=1 vuelve a estos)
  lastSubs: [
    { name: "Lucia_Fan", months: 1 },
    { name: "ViceCityVIP", months: 6 },
    { name: "JasonDuval_ES", months: 1 },
    { name: "LeonidaKing", months: 3 },
    { name: "PalmeraNeon", months: 1 }
  ],
  // Mensajes del chat con ?test=1
  chat: [
    { name: "Lucia_Fan", color: "#FF69B4", badges: "subscriber/6", text: "¡Por fin GTA VI en el canal! 🌴" },
    { name: "ViceCityVIP", color: "#1E90FF", badges: "vip/1", text: "Kappa ese coche no llega a la huida", emotes: "25:0-4" },
    { name: "el_chachocanario", color: "#9146FF", badges: "broadcaster/1", text: "Bienvenidos a Leonida, gente" },
    { name: "PalmeraNeon", color: "#000080", text: "qué ganas de ver Vice City de noche" },
    { name: "ModCanario", color: "#00FF7F", badges: "moderator/1", text: "Recordad: buen rollo en el chat" }
  ],
  // Alertas de alerts.html?test=1
  alerts: [
    { kind: "sub", name: "Lucia_Fan", tier: "1000" },
    { kind: "resub", name: "ViceCityVIP", months: 14, message: "¡Un año más en Leonida! 🌴" },
    { kind: "gift", name: "JasonDuval_ES", count: 5 },
    { kind: "cheer", name: "PalmeraNeon", bits: 500, message: "¡Pilla ese coche para la huida!" }
  ],
  // Nombres al azar del panel de alertas (control.html) cuando el nombre se deja vacío
  names: ["Lucia_Fan", "ViceCityVIP", "JasonDuval_ES", "LeonidaKing", "PalmeraNeon", "NeonFlamingo", "OceanDrive_86"]
};

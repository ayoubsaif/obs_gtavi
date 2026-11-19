/* ============================================================================
   Scene collections for OBS Studio (.json) and Streamlabs Desktop (.overlay).
   Used by install.html; this file is the single source of truth for the layout
   (it replaces the old Python builders that lived in tools/).

   OVERLAY_COLLECTION.buildObs({ root, assetsRoot, width, height, stingers }) -> object
     stingers: true adds the animated transitions from assets/stingers (made with stingers.html)
   OVERLAY_COLLECTION.buildStreamlabs({ root })                    -> object (config.json)
   OVERLAY_COLLECTION.toOverlayZip(config)                         -> Uint8Array (.overlay)
   root: absolute folder of the overlay pages, forward slashes, no trailing slash (e.g. "D:/obs/gtavi").
   assetsRoot: defaults to <root>/assets (e.g. "D:/obs/gtavi/assets").
   Pages are authored at 1920x1080 and scale themselves; positions below are in 1920 px.
   ============================================================================ */
(function (g) {
  "use strict";
  const COLLECTION = "GTA VI · el_chachocanario";
  const OBS_FILE = "GTAVI-el_chachocanario-OBS.json";
  const STREAMLABS_FILE = "GTAVI-el_chachocanario.overlay";
  const SCENES_DIR = "scenes";   // the overlay pages live in <root>/scenes
  const PAGES = ["starting-soon.html", "starting-soon-cam.html", "ingame.html", "brb.html", "stream-ending.html", "alerts.html"];
  const TRANSITION_SOUND = "sounds/everglades_mission_passed.mp3";   // relative to assetsRoot
  // Animated stingers (made by stingers.html with the album effects from fx.js), saved as assets/stingers/<effect>.webm.
  // Timeline: the effect covers the screen (inMs), holds the neon gradient card (holdMs) while OBS cuts at cutMs,
  // then plays back to reveal the new scene (outMs); the sound keeps playing after that.
  const STINGER = {
    dir: "stingers", prerollMs: 120, inMs: 400, holdMs: 200, outMs: 400, cutMs: 500,   // cutMs: from the start of the animation
    // effect used when switching TO each scene (OBS has no random transition, so each scene gets its own)
    sceneFx: {
      "GTA VI · Empezamos en breve": "crosszoom",
      "GTA VI · Empezamos en breve (cámara)": "push",
      "GTA VI · En partida": "wipe",
      "GTA VI · Vuelvo enseguida": "blinds",
      "GTA VI · Fin del directo": "iris",
    },
    defaultFx: "wipe",
    names: { crosszoom: "Zoom cruzado", wipe: "Barrido neón", blinds: "Persianas", iris: "Iris", push: "Empuje" },
  };
  const CAPTURE = { game: "Captura de juego", video: "Capturadora de vídeo" };
  const POINTS_NAME = "Alertas de puntos (enlace externo)";
  const stingerName = fx => `GTA VI · ${STINGER.names[fx]}`;
  const CSS = "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }";

  function uuid() {
    if (g.crypto && g.crypto.randomUUID) return g.crypto.randomUUID();
    const b = new Uint8Array(16);
    if (g.crypto && g.crypto.getRandomValues) g.crypto.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.random() * 256 | 0;
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  // ------------------------------------------------------------------ OBS Studio
  function buildObs({ root, assetsRoot = root + "/assets", width = 2560, height = 1440, stingers = false, capture = "game", pointsUrl = "" }) {
    const W = width, H = height, K = W / 1920;
    const MAIN_CANVAS = "6c69626f-6273-4c00-9d88-c5136d61696e";   // OBS 31+ fixed id of the main canvas
    const PREV_VER = 553648129;                                    // OBS 33.0.1
    const sources = [];

    function source(name, kind, settings, audio = false) {
      const s = {
        name, uuid: uuid(), id: kind, versioned_id: kind,
        settings, mixers: audio ? 255 : 0, sync: 0, flags: 0,
        volume: 1.0, balance: 0.5, enabled: true, muted: false,
        "push-to-mute": false, "push-to-mute-delay": 0, "push-to-talk": false, "push-to-talk-delay": 0,
        hotkeys: {}, deinterlace_mode: 0, deinterlace_field_order: 0, monitoring_type: 0,
        private_settings: {}, filters: [], prev_ver: PREV_VER,
      };
      if (kind === "scene") { s.canvas_uuid = MAIN_CANVAS; s.monitoring_enabled = false; }
      sources.push(s);
      return s;
    }

    // audio=true: the page's sound goes through OBS (mixer + stream) and is also monitored locally
    function browser(name, html, audio = false) {
      const s = source(name, "browser_source", {
        is_local_file: true, local_file: `${root}/${SCENES_DIR}/${html}`,
        width: W, height: H, fps_custom: false, fps: 30,
        css: CSS,
        shutdown: true,              // stop when hidden (keeps Twitch connections <= 3)
        restart_when_active: true,   // replay intro / reset timers when the scene is shown
        reroute_audio: audio,
      }, audio);
      if (audio) s.monitoring_type = 2;   // OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT
      return s;
    }

    function item(src, id, { x = 0, y = 0, box } = {}) {
      const it = {
        name: src.name, source_uuid: src.uuid, visible: true, locked: false,
        rot: 0.0, pos: { x: x * K, y: y * K }, scale: { x: 1.0, y: 1.0 },
        align: 5, bounds_type: 0, bounds_align: 0, bounds: { x: 0.0, y: 0.0 },
        crop_left: 0, crop_top: 0, crop_right: 0, crop_bottom: 0,
        id, group_item_backup: false, scale_filter: "disable",
        blend_method: "default", blend_type: "normal",
        show_transition: { duration: 0 }, hide_transition: { duration: 0 }, private_settings: {},
      };
      if (box) {                      // fit inside a box regardless of the device resolution
        it.bounds_type = 2;           // OBS_BOUNDS_SCALE_INNER
        it.bounds = { x: box[0] * K, y: box[1] * K };
      }
      return it;
    }

    // members: [source, opts], bottom layer first
    function scene(name, members) {
      const items = members.map(([src, kw], i) => item(src, i + 1, kw));
      return source(name, "scene", { id_counter: items.length, custom_size: false, items });
    }

    const alertsHtml = browser("Alertas Twitch (overlay)", "alerts.html", true);
    const alertsMembers = [[alertsHtml, {}]];
    if (pointsUrl) {   // channel-points alerts from an external overlay (e.g. TriggerFyre), on top of ours
      const pts = source(POINTS_NAME, "browser_source", {
        is_local_file: false, url: pointsUrl,
        width: W, height: H, fps_custom: false, fps: 30, css: CSS,
        shutdown: false,               // keep it connected so no redeem is missed
        restart_when_active: false,    // don't cut an alert that is playing while you switch scenes
        reroute_audio: true,
      }, true);
      pts.monitoring_type = 2;         // heard in the stream and by you
      alertsMembers.push([pts, {}]);
    }
    const alertsScene = scene("GTA VI · Alertas (no borrar)", alertsMembers);
    // «En partida» background: game capture, or a video capture device (capture card / camera; pick it after import)
    const game = capture === "video"
      ? source(CAPTURE.video, "dshow_input", {}, true)
      : source(CAPTURE.game, "game_capture", { capture_mode: "any_fullscreen", capture_cursor: false });
    const cam = source("Webcam", "dshow_input", {});   // pick your camera in its properties after import

    const sStart = scene("GTA VI · Empezamos en breve", [
      [browser("Empezamos en breve (overlay)", "starting-soon.html"), {}],
      [alertsScene, {}],
    ]);
    const sStartCam = scene("GTA VI · Empezamos en breve (cámara)", [
      [cam, { x: 1300, y: 589, box: [560, 315] }],         // under the page: shows through its transparent hole
      [browser("Empezamos en breve con cámara (overlay)", "starting-soon-cam.html"), {}],
      [alertsScene, {}],
    ]);
    const sGame = scene("GTA VI · En partida", [
      [game, { box: [1920, 1080] }],
      [cam, { x: 32, y: 600, box: [336, 189] }],           // inside the frame of ingame.html (left column)
      [browser("Marco en partida (overlay)", "ingame.html"), {}],
      [alertsScene, {}],
    ]);
    const sBrb = scene("GTA VI · Vuelvo enseguida", [
      [browser("Vuelvo enseguida (overlay)", "brb.html"), {}],
      [alertsScene, {}],
    ]);
    const sEnd = scene("GTA VI · Fin del directo", [
      [browser("Fin del directo (overlay)", "stream-ending.html"), {}],
    ]);

    // Sound-only stinger (the "Misión superada" sound): the cut happens at transition_point while the sound plays on
    // preload=false for the WebM stingers: OBS "Preload video to memory" (full_decode) drops the Opus audio
    // that Chrome MediaRecorder writes (log: "Could not update timestamps for discarded samples"); the mp3 keeps it.
    const stinger = (name, path, point, preload = true) => ({
      name, id: "obs_stinger_transition",
      settings: {
        path,
        transition_point_type: 0,      // time (ms)
        transition_point: point,
        audio_monitoring: 2,           // monitor and output
        audio_fade_style: 0,
        preload, hw_decode: false,
      },
    });
    const AUDIO_ONLY = "GTA VI · Solo sonido";
    const transitions = [stinger(AUDIO_ONLY, `${assetsRoot}/${TRANSITION_SOUND}`, 300)];
    let current = AUDIO_ONLY;

    // stingers=true: one animated stinger per album effect, and each scene uses its own when you switch TO it
    // (OBS per-scene "Transition override", kept in the scene's private settings).
    if (stingers) {
      for (const fx of Object.keys(STINGER.names))
        transitions.push(stinger(stingerName(fx), `${assetsRoot}/${STINGER.dir}/${fx}.webm`, STINGER.prerollMs + STINGER.cutMs, false));
      for (const s of [sStart, sStartCam, sGame, sBrb, sEnd]) {
        const fx = STINGER.sceneFx[s.name];
        if (fx) s.private_settings = { transition: stingerName(fx), transition_duration: 300 };
      }
      current = stingerName(STINGER.defaultFx);
    }

    const order = [sStart, sStartCam, sGame, sBrb, sEnd, alertsScene];
    return {
      name: COLLECTION,
      current_scene: sStart.name, current_program_scene: sStart.name,
      scene_order: order.map(s => ({ name: s.name })),
      sources, groups: [],
      transitions, current_transition: current, transition_duration: 400,
      quick_transitions: [], saved_projectors: [], preview_locked: false,
      scaling_enabled: false, scaling_level: 0, scaling_off_x: 0.0, scaling_off_y: 0.0,
      modules: {}, version: 2, canvases: [],
    };
  }

  // ------------------------------------------------------------------ Streamlabs Desktop
  // Format follows stream-labs/desktop app/services/scene-collections. Positions/scales are fractions of the base resolution.
  function buildStreamlabs({ root, capture = "game", pointsUrl = "" }) {
    const W = 1920, H = 1080;
    const node = (name, x, y, content) => ({
      id: uuid(), name, sceneNodeType: "item",
      x, y, scaleX: 1 / W, scaleY: 1 / H,
      rotation: 0, visible: true, locked: false, filters: [], content,
    });
    const browser = (name, html, url) => node(name, 0, 0, {
      schemaVersion: 1, nodeType: "SmartBrowserNode", type: "smart_browser_source",
      settings: url
        ? { is_local_file: false, local_file: "", url, width: W, height: H, fps: 30, css: CSS,
            shutdown: false, restart_when_active: false, reroute_audio: true }
        : { is_local_file: true, local_file: `${root}/${SCENES_DIR}/${html}`, url: "",
            width: W, height: H, fps: 30, css: CSS,
            shutdown: true, restart_when_active: true, reroute_audio: false },
    });
    const gameCapture = name => node(name, 0, 0, { schemaVersion: 2, nodeType: "GameCaptureNode", width: W, height: H });
    const webcam = (name, x, y, w, h) => node(name, x / W, y / H, { schemaVersion: 1, nodeType: "WebcamNode", width: w / W, height: h / H });
    const nested = (name, sceneId) => node(name, 0, 0, { schemaVersion: 2, nodeType: "SceneSourceNode", sceneId, width: W, height: H });
    const scene = (name, sceneId, items) => ({ name, sceneId, slots: { schemaVersion: 1, nodeType: "SlotsNode", items } });

    const alertsId = uuid();
    const alerts = () => nested("Alertas Twitch", alertsId);
    const scenes = [   // the first one becomes the active scene after import
      scene("GTA VI · Empezamos en breve", uuid(), [browser("Empezamos en breve (overlay)", "starting-soon.html"), alerts()]),
      scene("GTA VI · Empezamos en breve (cámara)", uuid(), [
        webcam("Webcam", 1300, 589, 560, 315),
        browser("Empezamos en breve con cámara (overlay)", "starting-soon-cam.html"), alerts()]),
      scene("GTA VI · En partida", uuid(), [
        capture === "video" ? webcam(CAPTURE.video, 0, 0, W, H) : gameCapture(CAPTURE.game), webcam("Webcam", 32, 600, 336, 189),
        browser("Marco en partida (overlay)", "ingame.html"), alerts()]),
      scene("GTA VI · Vuelvo enseguida", uuid(), [browser("Vuelvo enseguida (overlay)", "brb.html"), alerts()]),
      scene("GTA VI · Fin del directo", uuid(), [browser("Fin del directo (overlay)", "stream-ending.html")]),
      scene("GTA VI · Alertas (no borrar)", alertsId, [browser("Alertas Twitch (overlay)", "alerts.html"),
        ...(pointsUrl ? [browser(POINTS_NAME, null, pointsUrl)] : [])]),
    ];
    return {
      schemaVersion: 2, nodeType: "RootNode",
      scenes: { schemaVersion: 2, nodeType: "ScenesNode", items: scenes },
      transition: { schemaVersion: 1, nodeType: "TransitionNode", type: "fade_transition", duration: 400, settings: {} },
    };
  }

  // ------------------------------------------------------------------ minimal ZIP (STORE, UTF-8 names)
  const CRC = (() => { const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t; })();
  const crc32 = d => { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

  function zip(files) {   // files: [{ name, data: Uint8Array }]
    const enc = new TextEncoder(), parts = [], central = [];
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const local = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, dosTime, 2], [12, dosDate, 2],
       [14, crc, 4], [18, size, 4], [22, size, 4], [26, name.length, 2], [28, 0, 2]]
        .forEach(([o, v, n]) => n === 4 ? local.setUint32(o, v, true) : local.setUint16(o, v, true));
      parts.push(new Uint8Array(local.buffer), name, f.data);
      const cd = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, dosTime, 2], [14, dosDate, 2],
       [16, crc, 4], [20, size, 4], [24, size, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2],
       [38, 0, 4], [42, offset, 4]]
        .forEach(([o, v, n]) => n === 4 ? cd.setUint32(o, v, true) : cd.setUint16(o, v, true));
      central.push(new Uint8Array(cd.buffer), name);
      offset += 30 + name.length + size;
    }
    const cdSize = central.reduce((a, p) => a + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, cdSize, 4], [16, offset, 4], [20, 0, 2]]
      .forEach(([o, v, n]) => n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true));
    const all = [...parts, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
    let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  const toOverlayZip = config => zip([{ name: "config.json", data: new TextEncoder().encode(JSON.stringify(config, null, 2)) }]);

  g.OVERLAY_COLLECTION = { buildObs, buildStreamlabs, toOverlayZip, SCENES_DIR, PAGES, TRANSITION_SOUND, STINGER, stingerName, CAPTURE, POINTS_NAME, OBS_FILE, STREAMLABS_FILE, COLLECTION };
})(typeof window !== "undefined" ? window : globalThis);

"""
Builds an OBS Studio scene collection (.json) for the GTA VI overlay.

Import in OBS Studio: Scene Collection -> Import -> "..." -> pick the .json -> Import,
then select it in the Scene Collection menu.
Browser sources point at the HTML files by absolute path; if you move the overlay folder,
run this again:  python tools/build_obs_scene_collection.py
"""
import json
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OVERLAY_DIR = ROOT / "overlay"
COLLECTION = "GTA VI · el_chachocanario"
OUT = ROOT / "GTAVI-el_chachocanario-OBS.json"
W, H = 2560, 1440                 # OBS canvas (Ajustes -> Video -> Resolución base)
K = W / 1920                      # pages are authored at 1920x1080 and scale themselves; positions below are in 1920 px
MAIN_CANVAS = "6c69626f-6273-4c00-9d88-c5136d61696e"   # OBS 31+ fixed id of the main canvas
PREV_VER = 553648129                                     # OBS 33.0.1, as in the existing collection

sources = []


def source(name, kind, settings, audio=False):
    s = {
        "name": name, "uuid": str(uuid.uuid4()), "id": kind, "versioned_id": kind,
        "settings": settings, "mixers": 255 if audio else 0, "sync": 0, "flags": 0,
        "volume": 1.0, "balance": 0.5, "enabled": True, "muted": False,
        "push-to-mute": False, "push-to-mute-delay": 0, "push-to-talk": False, "push-to-talk-delay": 0,
        "hotkeys": {}, "deinterlace_mode": 0, "deinterlace_field_order": 0, "monitoring_type": 0,
        "private_settings": {}, "filters": [], "prev_ver": PREV_VER,
    }
    if kind == "scene":
        s["canvas_uuid"] = MAIN_CANVAS
        s["monitoring_enabled"] = False
    sources.append(s)
    return s


def browser(name, html, audio=False):
    """audio=True: the page's sound goes through OBS (mixer + stream) and is also monitored locally."""
    path = (OVERLAY_DIR / html).resolve()
    assert path.exists(), path
    s = source(name, "browser_source", {
        "is_local_file": True, "local_file": path.as_posix(),
        "width": W, "height": H, "fps_custom": False, "fps": 30,
        "css": "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }",
        "shutdown": True,              # stop when hidden (keeps Twitch connections <= 3)
        "restart_when_active": True,   # replay intro / reset timers when the scene is shown
        "reroute_audio": audio,
    }, audio=audio)
    if audio:
        s["monitoring_type"] = 2       # OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT: heard in the stream and by you
    return s


def item(src, item_id, x=0, y=0, box=None, scale=1.0, fade=0):
    """x/y in 1920 px; scale is the OBS item scale (canvas px); fade = show/hide transition in ms."""
    it = {
        "name": src["name"], "source_uuid": src["uuid"], "visible": True, "locked": False,
        "rot": 0.0, "pos": {"x": x * K, "y": y * K}, "scale": {"x": scale, "y": scale},
        "align": 5, "bounds_type": 0, "bounds_align": 0, "bounds": {"x": 0.0, "y": 0.0},
        "crop_left": 0, "crop_top": 0, "crop_right": 0, "crop_bottom": 0,
        "id": item_id, "group_item_backup": False, "scale_filter": "disable",
        "blend_method": "default", "blend_type": "normal",
        "show_transition": {"duration": fade}, "hide_transition": {"duration": fade}, "private_settings": {},
    }
    if box:  # fit inside a box regardless of the device resolution
        it["bounds_type"] = 2          # OBS_BOUNDS_SCALE_INNER
        it["bounds"] = {"x": box[0] * K, "y": box[1] * K}
    return it


def scene(name, members):
    """members: list of (source, kwargs), bottom layer first."""
    items = [item(src, i + 1, **kw) for i, (src, kw) in enumerate(members)]
    return source(name, "scene", {"id_counter": len(items), "custom_size": False, "items": items})


# Private URLs (tokens) live in a gitignored file so the committed collection never carries them:
#   tools/obs_secrets.json  ->  {"triggerfyre_url": "https://overlays.thefyrewire.com/triggerfyre/...?token=..."}
# When it exists, a second collection with the real URLs is written to OUT_LOCAL (also gitignored): import that one.
SECRETS_FILE = ROOT / "tools" / "obs_secrets.json"
OUT_LOCAL = ROOT / "GTAVI-el_chachocanario-OBS.local.json"
secrets = json.loads(SECRETS_FILE.read_text(encoding="utf-8")) if SECRETS_FILE.exists() else {}

# ---- sources ----
alerts_html = browser("Alertas Twitch (overlay)", "alerts.html", audio=True)
triggerfyre = source("Navegador", "browser_source", {"url": ""})   # TriggerFyre overlay; URL filled from secrets
alerts_scene = scene("GTA VI · Alertas (no borrar)", [
    (alerts_html, {}),
    (triggerfyre, {"x": 1016 / K, "y": 141 / K, "scale": 0.66, "fade": 300}),
])

# Streaming PC devices (OBS matches them by id; on another PC just pick the device in its properties)
capture = source("Dispositivo de captura de video", "dshow_input", {       # AVerMedia GC573: the console/game
    "video_device_id": "AVerMedia HD Capture GC573 1:\\\\?\\pci#22ven_1461&dev_0054&subsys_57301461&rev_00#220000000101000a3500#22{65e8773d-8f56-11d0-a3b9-00a0c9223196}\\{adef4cb5-1401-4177-84ee-fe8b26c13a5b}",
    "last_video_device_id": "AVerMedia HD Capture GC573 1:\\\\?\\pci#22ven_1461&dev_0054&subsys_57301461&rev_00#220000000101000a3500#22{65e8773d-8f56-11d0-a3b9-00a0c9223196}\\{adef4cb5-1401-4177-84ee-fe8b26c13a5b}",
    "res_type": 1, "resolution": "2560x1440", "last_resolution": "2560x1440", "video_format": 301,
}, audio=True)
cam = source("Webcam", "dshow_input", {
    "video_device_id": "Camera (NVIDIA Broadcast):", "last_video_device_id": "Camera (NVIDIA Broadcast):",
})
mic = source("Broadcast", "wasapi_input_capture", {                         # NVIDIA Broadcast microphone
    "device_id": "{0.0.1.00000000}.{729d104f-8176-4775-ad6d-f2899c0b6250}",
}, audio=True)
MIC = (mic, {"fade": 300})

s_start = scene("GTA VI · Empezamos en breve", [
    (browser("Empezamos en breve (overlay)", "starting-soon.html"), {}),
    (alerts_scene, {}),
    MIC,
])
s_start_cam = scene("GTA VI · Empezamos en breve (cámara)", [
    (cam, {"x": 1300, "y": 589, "box": (560, 315)}),      # under the page: shows through its transparent hole
    (browser("Empezamos en breve con cámara (overlay)", "starting-soon-cam.html"), {}),
    (alerts_scene, {}),
    MIC,
])
s_game = scene("GTA VI · En partida", [
    (capture, {"fade": 300}),                              # 2560x1440 = canvas size
    (cam, {"x": 1604, "y": 890, "box": (288, 162)}),      # inside the neon frame of ingame.html
    (browser("Marco en partida (overlay)", "ingame.html"), {}),
    (alerts_scene, {}),
    MIC,
])
s_brb = scene("GTA VI · Vuelvo enseguida", [
    (browser("Vuelvo enseguida (overlay)", "brb.html"), {}),
    (alerts_scene, {}),
    MIC,
])
s_end = scene("GTA VI · Fin del directo", [
    (browser("Fin del directo (overlay)", "stream-ending.html"), {}),
    MIC,
])

# ---- transition: GTA VI logo stinger (silent, 0.95 s; tools/build_logo_stinger.py renders it) ----
# A striped panel covers the screen, the logo pops in, OBS cuts at TRANSITION_POINT_MS (panel fully closed)
# and the panel sweeps out over the new scene. Used for every scene change, including En partida.
TRANSITION = "Logo GTA VI"
TRANSITION_VIDEO = (ROOT / "assets" / "transitions" / "gtavi_logo_stinger.webm").resolve()
TRANSITION_POINT_MS = 400
assert TRANSITION_VIDEO.exists(), TRANSITION_VIDEO
transitions = [{
    "name": TRANSITION, "id": "obs_stinger_transition",
    "settings": {
        "path": TRANSITION_VIDEO.as_posix(),
        "transition_point_type": 0,          # time (ms)
        "transition_point": TRANSITION_POINT_MS,
        "audio_fade_style": 1,               # crossfade the scenes' audio (the stinger has none)
        "preload": True, "hw_decode": False,
    },
}]

order = [s_start, s_start_cam, s_game, s_brb, s_end, alerts_scene]
collection = {
    "name": COLLECTION,
    "current_scene": s_start["name"], "current_program_scene": s_start["name"],
    "scene_order": [{"name": s["name"]} for s in order],
    "sources": sources, "groups": [],
    "transitions": transitions, "current_transition": TRANSITION, "transition_duration": 400,
    "quick_transitions": [], "saved_projectors": [], "preview_locked": False,
    "scaling_enabled": False, "scaling_level": 0, "scaling_off_x": 0.0, "scaling_off_y": 0.0,
    "virtual-camera": {"type2": 3},
    "modules": {}, "version": 2, "canvases": [],
}

OUT.write_text(json.dumps(collection, indent=4, ensure_ascii=False), encoding="utf-8")
print(f"OK -> {OUT}")
if secrets.get("triggerfyre_url"):
    triggerfyre["settings"]["url"] = secrets["triggerfyre_url"]
    OUT_LOCAL.write_text(json.dumps(collection, indent=4, ensure_ascii=False), encoding="utf-8")
    print(f"OK -> {OUT_LOCAL} (with private URLs: import this one, never commit it)")
else:
    print(f"(no {SECRETS_FILE.name}: the TriggerFyre source has no URL; paste it in OBS or create the file)")

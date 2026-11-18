"""
Builds a Streamlabs Desktop .overlay file (zip with config.json) for the GTA VI overlay.

Import in Streamlabs Desktop: Settings -> Scene Collections -> Import Overlay File.
The browser sources point at the HTML files by absolute path, so if you move the
overlay folder, run this again:  python tools/build_streamlabs_overlay.py

Format follows stream-labs/desktop app/services/scene-collections (RootNode / ScenesNode /
SlotsNode / SmartBrowserNode / WebcamNode / GameCaptureNode / SceneSourceNode).
Slots are listed bottom layer first; positions/scales are fractions of the base resolution.
"""
import json
import uuid
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OVERLAY_DIR = ROOT / "overlay"
OUT = ROOT / "GTAVI-el_chachocanario.overlay"
W, H = 1920, 1080


def uid():
    return str(uuid.uuid4())


def browser(name, html, visible=True):
    path = (OVERLAY_DIR / html).resolve()
    assert path.exists(), path
    return {
        "id": uid(), "name": name, "sceneNodeType": "item",
        "x": 0, "y": 0, "scaleX": 1 / W, "scaleY": 1 / H,
        "rotation": 0, "visible": visible, "locked": False, "filters": [],
        "content": {
            "schemaVersion": 1, "nodeType": "SmartBrowserNode", "type": "smart_browser_source",
            "settings": {
                "is_local_file": True,
                "local_file": path.as_posix(),
                "url": "",
                "width": W, "height": H, "fps": 30,
                "css": "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }",
                "shutdown": True,              # stop when not visible (keeps Twitch connections <= 3)
                "restart_when_active": True,   # replay intro / reset timers when the scene is shown
                "reroute_audio": False,
            },
        },
    }


def game_capture(name):
    return {
        "id": uid(), "name": name, "sceneNodeType": "item",
        "x": 0, "y": 0, "scaleX": 1 / W, "scaleY": 1 / H,
        "rotation": 0, "visible": True, "locked": False, "filters": [],
        "content": {"schemaVersion": 2, "nodeType": "GameCaptureNode", "width": W, "height": H},
    }


def webcam(name, x, y, w, h):
    # matches the neon frame in ingame.html (288x162 at x=1604, y=890)
    return {
        "id": uid(), "name": name, "sceneNodeType": "item",
        "x": x / W, "y": y / H, "scaleX": 1 / W, "scaleY": 1 / H,
        "rotation": 0, "visible": True, "locked": False, "filters": [],
        "content": {"schemaVersion": 1, "nodeType": "WebcamNode", "width": w / W, "height": h / H},
    }


def nested_scene(name, scene_id):
    return {
        "id": uid(), "name": name, "sceneNodeType": "item",
        "x": 0, "y": 0, "scaleX": 1 / W, "scaleY": 1 / H,
        "rotation": 0, "visible": True, "locked": False, "filters": [],
        "content": {"schemaVersion": 2, "nodeType": "SceneSourceNode", "sceneId": scene_id, "width": W, "height": H},
    }


def scene(name, scene_id, slots):
    return {"name": name, "sceneId": scene_id,
            "slots": {"schemaVersion": 1, "nodeType": "SlotsNode", "items": slots}}


alerts_id = uid()
alerts = nested_scene("Alertas Twitch", alerts_id)

scenes = [  # first one becomes the active scene after import
    scene("GTA VI · Empezamos en breve", uid(), [
        browser("Empezamos en breve (overlay)", "starting-soon.html"),
        alerts,
    ]),
    scene("GTA VI · Empezamos en breve (cámara)", uid(), [
        webcam("Webcam", 1300, 589, 560, 315),  # under the page: shows through its transparent hole
        browser("Empezamos en breve con cámara (overlay)", "starting-soon-cam.html"),
        {**alerts, "id": uid()},
    ]),
    scene("GTA VI · En partida", uid(), [
        game_capture("Captura de juego"),
        webcam("Webcam", 1604, 890, 288, 162),
        browser("Marco en partida (overlay)", "ingame.html"),
        {**alerts, "id": uid()},
    ]),
    scene("GTA VI · Vuelvo enseguida", uid(), [
        browser("Vuelvo enseguida (overlay)", "brb.html"),
        {**alerts, "id": uid()},
    ]),
    scene("GTA VI · Fin del directo", uid(), [
        browser("Fin del directo (overlay)", "stream-ending.html"),
    ]),
    scene("GTA VI · Alertas (no borrar)", alerts_id, [
        browser("Alertas Twitch (overlay)", "alerts.html"),
    ]),
]

config = {
    "schemaVersion": 2, "nodeType": "RootNode",
    "scenes": {"schemaVersion": 2, "nodeType": "ScenesNode", "items": scenes},
    "transition": {"schemaVersion": 1, "nodeType": "TransitionNode",
                   "type": "fade_transition", "duration": 400, "settings": {}},
}

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("config.json", json.dumps(config, indent=2, ensure_ascii=False))

print(f"OK -> {OUT}")

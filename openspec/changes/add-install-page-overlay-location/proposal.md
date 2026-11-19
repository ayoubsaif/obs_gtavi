# Proposal

## Why

The committed OBS (`GTAVI-el_chachocanario-OBS.json`) and Streamlabs (`GTAVI-el_chachocanario.overlay`) collections hardcode absolute paths (`G:/obs/GTAVI/overlay/*.html`, `G:/obs/GTAVI/assets/sounds/everglades_mission_passed.mp3`). The repo now lives at `D:\obs\gtavi`, so importing either file gives six blank browser sources and a silent transition. The only documented fix ("run `python tools/build_*.py` again") fails because Python isn't installed on this machine (only the Microsoft Store alias is). The streamer needs a double-click way to choose where the overlay folder is and get a collection that works, in the same GTA VI pause-menu UI as `settings.html`. The OBS alerts dock (`control.html`) still uses the old dark-violet look and should match too.

## What Changes

- **New `overlay/install.html`** ("Instalar en OBS / Streamlabs"), same look as `settings.html`:
  - Detects the overlay folder from its own `file://` URL and shows it in an editable field (e.g. `D:/obs/gtavi/overlay`). The user can type or paste another folder for a different PC or drive.
  - Checks the chosen folder on a best-effort basis by trying to load `config.defaults.js` and the transition sound from it, then shows ✔ or ⚠ before anything is generated.
  - Canvas resolution selector for OBS (2560×1440 by default, plus 1920×1080 and a custom size).
  - **Download OBS collection (.json)** and **Download Streamlabs (.overlay)** buttons. The paths in both files are built from the chosen folder.
  - Step-by-step import instructions with the real paths filled in, including the OBS custom-dock URL for `control.html` with a copy button.
- **New `overlay/collection.js`**: the scenes, sources, layout, transition and the OBS and Streamlabs serializers ported from the two Python builders to plain browser JS, plus a small built-in ZIP writer for `.overlay` (no CDN, no Python).
- **New `overlay/ui.css`**: the pause-menu design tokens and components pulled out of `settings.html`'s inline `<style>`, shared by `settings.html`, `install.html` and `control.html`.
- **`settings.html`**: moves to `ui.css` with no visual change, and gets a link/tab to `install.html`.
- **`control.html` restyle**: uses `ui.css` tokens, fonts, buttons, iOS switch and fields, laid out for a narrow OBS dock (~300 px). Behaviour, element IDs and the WebSocket logic stay the same.
- **BREAKING (repo layout)**: remove `tools/build_obs_scene_collection.py` and `tools/build_streamlabs_overlay.py`, stop committing the machine-specific `GTAVI-el_chachocanario-OBS.json` / `.overlay`, and add them to `.gitignore`. `collection.js` becomes the single source of truth.
- **Docs**: in `overlay/README.md` and the header comments of `settings.html`/`control.html`, replace the `G:/obs/GTAVI` paths and Python steps with "open `install.html`".

## Capabilities

### New Capabilities
- `scene-collection-install`: generating importable OBS and Streamlabs scene collections whose file paths come from an overlay folder the user chooses, plus guided import steps.
- `overlay-admin-ui`: the shared GTA VI pause-menu look and behaviour for the overlay's admin pages (`settings.html`, `install.html`, `control.html` dock).

### Modified Capabilities
<!-- none: openspec/specs/ is empty -->

## Impact

- New files: `overlay/install.html`, `overlay/collection.js`, `overlay/ui.css`.
- Modified: `overlay/settings.html` (CSS moved out, link added), `overlay/control.html` (markup and CSS), `overlay/README.md`, `.gitignore`.
- Removed: `tools/build_obs_scene_collection.py`, `tools/build_streamlabs_overlay.py`, and the committed generated collections (untracked, not deleted from disk).
- No new dependencies. Everything still runs from `file://` in Chrome/Edge and in OBS's CEF dock. The scene pages (`ingame.html`, `alerts.html`, etc.) are untouched.

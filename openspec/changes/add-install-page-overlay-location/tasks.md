# Tasks

## 1. Shared admin stylesheet

- [x] 1.1 Create `overlay/ui.css` with the tokens and components moved out of `settings.html`'s `<style>` (design D6), plus the new `.pill`, `.copy` and `.steps` pieces, with no `:has()` and no CSS nesting. Verify: `grep -E ":has\(|&" overlay/ui.css` finds nothing.
- [x] 1.2 Make `settings.html` link `ui.css`, keep only page-specific CSS inline, and add a header link «Instalar en OBS →» to `install.html`. Verify: before/after screenshots in Chrome at 1280 px and 600 px look the same, Ctrl+S still saves, and the tab scroll-spy still highlights.

## 2. Collection builder in JS

- [x] 2.1 Create `overlay/collection.js` with `buildObs({ root, assetsRoot, width, height })` that ports `build_obs_scene_collection.py` 1:1 (sources, scenes, items with `K = width/1920`, stinger, `MAIN_CANVAS`, `PREV_VER`). Verify: a node script (`node -e` loading the file with a `window` shim) using root `G:/obs/GTAVI/overlay`, 2560×1440, prints JSON that matches the committed `GTAVI-el_chachocanario-OBS.json` once `uuid`/`source_uuid` values are normalized.
- [x] 2.2 Add `buildStreamlabs({ root })` that ports `build_streamlabs_overlay.py` (shared alerts scene id, fresh ids per nested item). Verify: the same node parity check against the `config.json` unzipped from the committed `.overlay`, with ids normalized.
- [x] 2.3 Add the STORE ZIP writer (CRC-32, UTF-8 flag) and `toOverlayZip(config) → Uint8Array` (design D4). Verify: write the bytes to a scratch file from node, `unzip -l` / PowerShell `Expand-Archive` lists `config.json`, and its contents round-trip with `ensure_ascii=False` characters intact (`·`, `á`).

## 3. Install page

- [x] 3.1 Create `overlay/install.html` with the shared header/nav and sections from design D7, using `ui.css`. Verify: opening `file:///D:/obs/gtavi/overlay/install.html` renders all six sections, with no console errors and no horizontal scroll at 375 px.
- [x] 3.2 Add folder detection, normalization, `localStorage` persistence (`gta6-overlay.install.v1`), a reset to the detected folder, and the derived assets path (design D2). Verify against the spec scenarios: the detected value is `D:/obs/gtavi/overlay`, pasting `G:\obs\GTAVI\overlay\` gives `G:/obs/GTAVI/overlay`, the value survives a reload, and an `http://` load leaves the field empty with a hint.
- [x] 3.3 Add the debounced script/audio probes with ✔/⚠/"no se pudo comprobar" states that never disable downloads (design D3). Verify: the real folder shows ✔, `C:/nope/overlay` shows ⚠ and both buttons still work.
- [ ] 3.4 Add the canvas select (2560×1440 default, 1920×1080, custom) and the two download buttons with the existing filenames, plus a `<textarea>` fallback if the download throws. Verify: import the downloaded `.json` into OBS (Colección de escenas → Importar) and the six overlay sources render from `D:/obs/gtavi/overlay` and "Misión superada" plays; with 1920×1080 the webcam in "En partida" sits in the frame at a 1920×1080 base resolution.
- [x] 3.5 Verify the Streamlabs download imports in Streamlabs Desktop (Ajustes → Colecciones de escenas → Importar archivo de overlay) with six scenes loading from the chosen folder. If Streamlabs isn't installed, record that it wasn't checked and confirm the zip structure from 2.3 instead. _(Streamlabs Desktop is not installed on this PC: import not checked; the zip structure was confirmed in 2.3 and config.json is identical to the Python output.)_
- [x] 3.6 Fill in the import steps and the copyable dock URL `file:///<root>/control.html` with the real paths, with copy buttons that confirm with a state change. Verify: pasting the clipboard gives the exact URL, and changing the folder field updates every shown path.

## 4. Retire Python builders and machine-specific files

- [x] 4.1 Delete `tools/build_obs_scene_collection.py` and `tools/build_streamlabs_overlay.py` (only after 2.1 and 2.2 pass), add `GTAVI-el_chachocanario-OBS.json` and `GTAVI-el_chachocanario.overlay` to `.gitignore`, and `git rm --cached` both. Verify: `git status` shows the deletions and untracking, and both files still exist on disk.
- [x] 4.2 Update `overlay/README.md`: replace the OBS/Streamlabs import sections and the "regenera con python" lines with "abre `install.html`", replace the `G:/obs/GTAVI` dock URL with the instruction to copy it from `install.html`, and list `install.html`/`collection.js`/`ui.css` in the files table. Also update the header comments in `settings.html`/`control.html` so they don't hardcode paths. Verify: `grep -rn "G:/obs\|G:\\\\obs\|build_.*\.py" overlay tools` finds nothing.

## 5. Restyle the alerts dock

- [x] 5.1 Move `control.html` to `ui.css` with the `body.dock` compact modifier (design D6): switch-style "Contar…" toggle, pill buttons with sub/gift/bits token colours, cards and the status dot. Keep every element ID and the script logic unchanged. Verify: `git diff overlay/control.html` touches no lines inside `<script>`, and there's no horizontal scroll at 220 px and 240 px in Chrome devtools.
- [ ] 5.2 Test in the real OBS custom dock: the saved `gta6-overlay.dock.v1` prefs load and it connects automatically, and Sub / Resub 6 / Regalo 5 / Bits 500 each show in `alerts.html` with the log updating. Verify by watching the alerts scene preview in OBS.

## 6. Integration check

- [ ] 6.1 End-to-end on a copy of the repo at a path with spaces (e.g. `D:/obs/Copia GTA/overlay`): open `install.html` there and check it detects that path, download both collections, import the OBS one and confirm every scene renders and the dock URL works. Verify: all scenes are visible in the OBS preview with no "missing files" dialog.

# Design

## Context

- Two Python builders (`tools/build_obs_scene_collection.py`, `tools/build_streamlabs_overlay.py`) hold the scene layout and bake `Path(__file__)`-relative absolute paths into the generated files. Those files are committed, so they carry the author's old `G:/obs/GTAVI` location. See proposal.md → Why.
- All admin pages run from `file://` in Chrome/Edge, and `control.html` also runs in OBS's CEF custom dock. From `file://`, `fetch()`/XHR of sibling files is blocked, while `<script src>`, `<img>` and `<audio>` loads work. That is why `settings.html` already loads `config.js` through a script tag.
- `settings.html` keeps its whole design system inline (tokens on `:root`, `.field` rows, `.check` switch, pill buttons, `nav` tabs). `control.html` has its own older palette (`--bg #12081f`, `--sunset` gradient, Segoe UI).
- `control.html` stores prefs under the `localStorage` key `gta6-overlay.dock.v1` (+ `.record`). The IDs `name`, `message`, `months`, `count`, `bits`, `record`, `host`, `port`, `password`, `save`, `status`, `statusText` and `log` are used by its script.

## Goals / Non-Goals

**Goals:**
- One source of truth for the collection layout, in JS, usable offline from `file://`.
- Byte-for-byte the same layout semantics as today's Python output (scenes, order, positions, bounds, audio, stinger). Only the paths and the optional canvas size change.
- One shared stylesheet, so the three admin pages can't drift apart again.

**Non-Goals:**
- Writing the collection straight into OBS's `scenes/` profile folder, or driving the import over WebSocket. The user still imports by hand.
- Detecting the camera or game. The user still picks them after import, as today.
- Restyling the on-stream scene pages (`ingame.html`, `alerts.html`, …).
- Moving the overlay files themselves.

## Decisions

### D1. Port the builders to `overlay/collection.js` and remove the Python scripts
`collection.js` exposes `window.OVERLAY_COLLECTION = { buildObs({ root, assetsRoot, width, height }), buildStreamlabs({ root }) }` and returns plain objects. `install.html` serializes and downloads them. The source/scene/item helpers map 1:1 onto the Python functions (`source`, `browser`, `item`, `scene`, plus the Streamlabs `browser`/`webcam`/`game_capture`/`nested_scene`), so a review can diff the logic side by side.
- *Alternative:* keep Python as the source of truth and emit a template with a `{{ROOT}}` placeholder for the page to fill in. Rejected because the user still needs Python to change the layout, there would be two formats to maintain, and a template can't rescale for another canvas.
- *Alternative:* keep both. Rejected because the layout would be duplicated and would drift.

### D2. Paths: detect from `location`, normalize, derive the assets folder
`root = decodeURIComponent(location.pathname).replace(/^\/(?=[A-Za-z]:)/, "").replace(/\/[^/]*$/, "")`. User input is normalized with `\` → `/`, whitespace trimmed and trailing `/` removed. `assetsRoot = root` with the last segment replaced by `assets` (the same as the Python `ROOT / "assets"`). It is shown read-only under the field. The value is stored in `localStorage["gta6-overlay.install.v1"]`, with a "Usar la carpeta detectada" reset. UNC paths (`//server/share/...`) pass through unchanged.

### D3. Best-effort verification via script/audio probes
- Overlay folder: inject `<script src="file:///<root>/config.defaults.js">`. If `onload` fires and `window.OVERLAY_DEFAULTS` is defined, the folder is good.
- Sound: `new Audio("file:///<assetsRoot>/sounds/everglades_mission_passed.mp3")`. `loadedmetadata` means found, `error` means missing.
- Probes are debounced 400 ms after typing. The result goes into a status pill using the `--ok`/`--warn` tokens. Per the spec, it never disables the download buttons, because a path typed for a *different* PC is expected to fail locally.

### D4. ZIP for `.overlay`: hand-written STORE zip
About 40 lines: CRC-32 table, one local file header, a central directory and an end-of-central-directory record, with UTF-8 flag (bit 11) set because the scene names contain `·`/`á`. There's no compression, which is fine for ~6 KB of JSON. Streamlabs reads it with a standard unzip library.
- *Alternative:* JSZip from cdnjs. Rejected because it would break the offline requirement and add a dependency for something this small.
- `CompressionStream("deflate-raw")` would also work, but it's async and needs a newer Chrome. STORE is simpler and universally readable.

### D5. Canvas size
A `<select>` with 2560×1440 (default, today's collection), 1920×1080 and Personalizado (two number inputs). `K = width / 1920` as in Python. `height` is only used for browser source height and the stinger/scene defaults. The Streamlabs output stays fixed at fractions of its base resolution, so it needs no option, as today.

### D6. Shared `overlay/ui.css`
Move from `settings.html` everything except page-specific rules: `:root` tokens, body backdrop, `header/.bar/nav`, `section > h2/.intro`, `.field` rows, inputs, `.check` switch, buttons, `.list/.item`, `.note`, `code` and the 680 px media query. Add a few small shared pieces that `install.html` needs: `.pill` status badge, `.copy` row (readonly input + button), `.steps` (numbered list styled like menu rows). Fonts stay as the Google Fonts `<link>` in each page, with system fallbacks when offline.
- `control.html` adds a compact modifier (`body.dock`): 12 px gutter, 16–18 px HUD labels, 32 px controls, sections as cards on the same `--field` tint, and no sticky header/nav. Alert kinds map to tokens: sub → `--pink`, gift → `--warn`/orange, bits → `--teal`, with dark text on light fills to keep contrast. The status dot uses `--ok`/`--bad`.
- *Alternative:* a separate `dock.css`. Rejected because the tokens would be duplicated, and a modifier class is enough.

### D7. `install.html` structure
Same header (title "Instalar en OBS", state text, actions: **Descargar OBS (.json)** primary, **Descargar Streamlabs (.overlay)**) and the same nav tabs. Sections:
1. **Carpeta del overlay**: field, detected-folder reset, derived assets path, verification pill.
2. **Lienzo de OBS**: resolution select.
3. **OBS Studio**: numbered import steps with the filename, set base resolution, pick webcam/game.
4. **Streamlabs Desktop**: steps.
5. **Panel de alertas (dock)**: copyable `file:///<root>/control.html` and the WebSocket steps.
6. **Ajustes**: link to `settings.html`.

The downloaded filenames stay `GTAVI-el_chachocanario-OBS.json` and `GTAVI-el_chachocanario.overlay`, so the README steps stay familiar. The page doesn't need `config.js`. The channel name in the collection name stays hardcoded, as in Python, to keep parity.

### D8. Stop committing generated collections
Add both generated filenames to `.gitignore` and `git rm --cached` them. Users get them from `install.html`. This avoids committing absolute machine paths again.

## Risks / Trade-offs

- [Layout regressions while porting Python → JS] → A parity task generates the JSON with root `G:/obs/GTAVI/overlay` and diffs it against the committed file, ignoring `uuid`/`source_uuid` values, before the Python is deleted.
- [Probes behave differently in other browsers/CEF, e.g. Firefox blocks cross-directory `file://` scripts] → The probes only warn and never block. The page says "no se pudo comprobar" when neither event fires within 3 s.
- [Chrome blocks downloads from `file://` in some enterprise policies] → Fall back to showing the JSON in a `<textarea>` with a copy button (the OBS JSON only; `.overlay` has to be a file).
- [Removing the Python builders surprises someone with scripted workflows] → The README notes the change. The scripts stay in git history.
- [The `control.html` restyle breaks the CEF dock (older Chromium in OBS 30/31)] → Avoid `:has()` and CSS nesting in `ui.css`, keep the existing IDs and script untouched, and test in the real OBS dock.

## Migration Plan

1. Land `ui.css` + `settings.html` refactor (no visual change).
2. Land `collection.js` + `install.html`, and run the parity diff against the committed JSON.
3. Remove the Python builders, untrack the generated files and update the README.
4. Restyle `control.html` and test it in the OBS dock.

Rollback: revert the commits. The old committed collections come back from git.

## Open Questions

- Should the Streamlabs browser sources also mark audio reroute for alerts (OBS does, Streamlabs currently doesn't)? Keeping today's behaviour for parity. It can be changed later without touching the spec.

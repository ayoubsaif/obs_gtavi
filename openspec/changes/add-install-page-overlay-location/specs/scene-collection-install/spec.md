# Spec Delta

## Purpose

Lets the streamer produce OBS Studio and Streamlabs Desktop scene collections whose browser sources and transition sound point at wherever the overlay folder actually lives, without Python or hand-editing JSON.

## ADDED Requirements

### Requirement: Overlay folder is detected from the install page location
When `install.html` is opened from disk, it SHALL pre-fill the overlay folder field with the absolute folder that contains it, as a forward-slash path with URL escapes decoded (spaces, accents).

#### Scenario: Opened by double-click
- **WHEN** the user opens `file:///D:/obs/gtavi/overlay/install.html`
- **THEN** the overlay folder field shows `D:/obs/gtavi/overlay`

#### Scenario: Path with spaces and accents
- **WHEN** the page URL is `file:///E:/Mis%20Cosas/Directo%20Ca%C3%B1a/overlay/install.html`
- **THEN** the field shows `E:/Mis Cosas/Directo Caña/overlay`

#### Scenario: Not opened from disk
- **WHEN** the page is served over `http(s)://`
- **THEN** the field is empty, and a hint asks the user to type the folder where the overlay lives on the streaming PC

### Requirement: User can set a different overlay folder
The overlay folder field SHALL be editable. It SHALL accept Windows backslash paths and normalize them to forward slashes with no trailing slash. The chosen value SHALL be remembered in the browser between visits.

#### Scenario: Pasting a Windows path
- **WHEN** the user pastes `G:\obs\GTAVI\overlay\`
- **THEN** the folder used for generation is `G:/obs/GTAVI/overlay`

#### Scenario: Remembered value
- **WHEN** the user set `G:/obs/GTAVI/overlay` earlier and reopens the page
- **THEN** the field shows `G:/obs/GTAVI/overlay`, with a control to reset it to the detected folder

### Requirement: Chosen folder is verified before download
The page SHALL check, on a best-effort basis, that the chosen folder contains the overlay files and that the transition sound exists at `<folder>/../assets/sounds/everglades_mission_passed.mp3`. It SHALL show the result next to the field. A failed check SHALL warn but SHALL NOT block downloading.

#### Scenario: Correct folder
- **WHEN** the folder holds the overlay files and the sound file exists
- **THEN** the page shows a success state (✔ "Carpeta del overlay encontrada")

#### Scenario: Wrong folder
- **WHEN** the folder does not hold the overlay files
- **THEN** the page shows a warning that the imported scenes will be blank, and the download buttons stay enabled

### Requirement: OBS Studio collection download
The page SHALL generate and download an OBS Studio scene collection JSON with the same scenes, sources, layer order, positions, sizes, audio settings and "Misión superada" stinger as the current collection. Every browser source `local_file` SHALL be `<folder>/<page>.html` and the stinger `path` SHALL be the resolved sound path.

#### Scenario: Import after moving the repo
- **GIVEN** the folder is `D:/obs/gtavi/overlay`
- **WHEN** the user downloads the OBS collection and imports it in OBS
- **THEN** all six overlay browser sources load their pages from `D:/obs/gtavi/overlay/`, and the stinger plays `D:/obs/gtavi/assets/sounds/everglades_mission_passed.mp3`

#### Scenario: Canvas size
- **WHEN** the user selects 1920×1080 before downloading
- **THEN** browser source sizes and item positions in the file are scaled to a 1920×1080 canvas, and the instructions say to set that base resolution in OBS

### Requirement: Streamlabs Desktop overlay download
The page SHALL generate and download a `.overlay` file (ZIP with `config.json`) that Streamlabs Desktop can import, with the same scenes as the current one and every browser source `local_file` built from the chosen folder.

#### Scenario: Import in Streamlabs
- **WHEN** the user imports the downloaded `.overlay` through Settings → Scene Collections → Import Overlay File
- **THEN** a collection with the six GTA VI scenes is created and its browser sources load from the chosen folder

### Requirement: Import instructions use the real paths
The page SHALL show numbered import steps for OBS and Streamlabs, and the OBS custom browser dock URL for `control.html` (`file:///<folder>/control.html`). Each shown path SHALL come from the chosen folder and have a copy-to-clipboard button.

#### Scenario: Copy dock URL
- **WHEN** the user clicks copy next to the dock URL
- **THEN** `file:///D:/obs/gtavi/overlay/control.html` is on the clipboard and the button confirms it

### Requirement: No external tooling required
Generating both collections SHALL work fully offline from `file://` in Chrome or Edge, without Python, a local server or a CDN script.

#### Scenario: Offline PC without Python
- **WHEN** the PC has no internet and no Python
- **THEN** both download buttons still produce valid files

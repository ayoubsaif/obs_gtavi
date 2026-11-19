# Spec Delta

## Purpose

Gives the overlay's admin pages (settings editor, install page and OBS alerts dock) one consistent GTA VI pause-menu look, so they feel like part of the same product.

## ADDED Requirements

### Requirement: Shared pause-menu look across admin pages
`settings.html`, `install.html` and `control.html` SHALL use the same visual language: violet gradient backdrop, dark top bar, Barlow Condensed uppercase labels, Inter body text, rows with thin dividers, pill buttons (white primary), pink focus ring and accent, and teal iOS-style switches.

#### Scenario: Visual parity
- **WHEN** `settings.html` and `install.html` are opened side by side
- **THEN** header, section titles, field rows, inputs, buttons and switches look the same

#### Scenario: settings.html unchanged
- **WHEN** `settings.html` is opened after the change
- **THEN** it looks and behaves as it did before (same sections, saving and tabs)

### Requirement: Admin pages link to each other
`settings.html` SHALL link to `install.html`, and `install.html` SHALL link back to `settings.html`, both from the header area.

#### Scenario: Navigate to install
- **WHEN** the user clicks the install link in `settings.html`
- **THEN** `install.html` opens. If there are unsaved settings, the normal unsaved-changes prompt appears first.

### Requirement: Alerts dock adopts the shared look at dock width
`control.html` SHALL use the shared look and stay usable at OBS dock widths from 220 px up, without horizontal scrolling. Alert buttons SHALL keep distinct colours per kind (sub, gift, bits) from the shared palette.

#### Scenario: Narrow dock
- **WHEN** the dock is 240 px wide
- **THEN** all alert buttons, inputs and the OBS connection panel fit without horizontal scrolling

### Requirement: Alerts dock behaviour is preserved
Restyling `control.html` SHALL NOT change what it does: connecting to OBS WebSocket, the status indicator, the name/message/months/gift/bits inputs, the "Contar en últimos subs y objetivo" option, the connection settings and saved preferences.

#### Scenario: Fire an alert after restyle
- **GIVEN** the dock is connected to OBS
- **WHEN** the user clicks "Regalo" with 5 subs
- **THEN** `alerts.html` shows the gift alert as before, and the dock log reports it

#### Scenario: Saved preferences survive
- **WHEN** a user who saved host, port and password before the restyle opens the dock
- **THEN** the saved values are loaded and it connects automatically

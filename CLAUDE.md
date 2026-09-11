# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid/Breakout game in plain HTML, CSS and JavaScript — **no dependencies, no build step, no package manager**. Implementation not started yet; only assets exist.

## Running

- No build/lint/test tooling. Open `index.html` (to be created at repo root) in a browser.
- If ES modules (`<script type="module">`) are used, `file://` fails on CORS → serve via static server, e.g. `npx serve .` or `python -m http.server`.

## Existing assets

- `assets/spritesheet-breakout.png` — single spritesheet for paddle, ball, bricks and brick explosions.
- `assets/spritesheet.js` — classic (non-module) script exposing **globals**:
  - `SPRITES` — source rects (`sx, sy, sw, sh`) for `paddle`, `ball`, `blocks.<color>`.
  - `EXPLOSION_FRAMES.<color>` — 4-frame explosion animation per brick color; `EXPLOSION_DURATION = 150` (ms).
  - `loadSpritesheet(cb)` — async load, copies image to offscreen canvas, queues callbacks until loaded. Start the game loop inside `cb`.
  - `drawSprite(ctx, name, x, y, w, h)` — `name` is `'paddle'`, `'ball'` or `'block_<color>'`.
  - `drawFrame(ctx, frame, x, y, w, h)` — draw a raw frame rect (used for explosions).
  - Brick colors: `gray, red, yellow, cyan, magenta, hotpink, green`.
- Spritesheet path is hardcoded relative (`assets/spritesheet-breakout.png`) → the HTML page loading `spritesheet.js` must live at repo root.
- Must be loaded via plain `<script src="assets/spritesheet.js">` before game code (or converted to a module with exports).
- Known quirk: `EXPLOSION_FRAMES.gray` reuses the red frames' coordinates.
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — bounce and brick-break SFX (use `Audio`; browsers block playback before first user interaction).

## Skills

`skills-lock.json` references `spec` and `spec-impl` skills from `Klerith/fernando-skills` (spec-driven workflow: write spec, then implement it).

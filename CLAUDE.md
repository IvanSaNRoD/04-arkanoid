# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid/Breakout game in plain HTML, CSS and JavaScript — **no dependencies, no build step, no package manager**. Built with a spec-driven workflow (see below).

Implemented specs:

- `specs/01-playable-mvp.md` — single-level playable MVP (paddle, ball, 54 bricks, lives, score, pause, sounds, localStorage high score).

## Running

- No build/lint/test tooling. Open `index.html` directly via `file://` — works without a server (classic scripts, no ES modules).
- Testing is manual: verify against the spec's acceptance criteria checklist.

## Architecture

Files at repo root, loaded by `index.html` as classic scripts in this order (order matters — later scripts read earlier top-level `const`s as shared globals):

1. `assets/spritesheet.js` — sprite/explosion globals (see Assets).
2. `constants.js` — immutable config only: dimensions, tuning, `HIGHSCORE_KEY`, `ROWS` (color + points per row).
3. `game.js` — mutable `state`, input, update, collisions, render, loop.

`style.css` only centers the 480×640 `<canvas id="game">`.

`game.js` key points:

- Single `state` object; `state.phase` drives everything: `'serve' | 'playing' | 'paused' | 'gameover' | 'win'`.
- Loop: `requestAnimationFrame(loop)` → `update(dt)` → `render()`. `dt` in seconds, clamped to `MAX_DT`. Loop starts inside `loadSpritesheet` callback.
- Input: `onAction()` (Space/click) serves or restarts; `togglePause()` (P/Esc); `blur` auto-pauses; mouse centers paddle; `setPaddleX()` clamps and tracks `state.paddleDir`.
- Collisions: walls → `collideBricks()` (max one brick/frame, reflect on smaller-overlap axis) → `collidePaddle()` (only when `vy > 0`, angle from impact offset, clamped between `MIN_BOUNCE_ANGLE` and `MAX_BOUNCE_ANGLE`).
- Explosions purely visual (`state.explosions`, pruned in `drawExplosions()`); brick stops colliding immediately.
- High score: `loadHighScore()` / `saveHighScore()` in try/catch; written only at game end (`endGame()`).

Conventions:

- Coordinates top-left origin; x/y = top-left corner of each rect. Velocities in px/s, `pos += vel * dt`.
- Tuning values go in `constants.js`, never hardcoded in `game.js`.
- Code style: 2-space indent, semicolons, single quotes, spaces inside parens/brackets (`foo( x )`, `arr[ i ]`), short `//` comment above non-obvious functions.
- No ES modules, no extra JS files beyond `constants.js` + `game.js` unless a spec decides otherwise.

## Assets

- `assets/spritesheet-breakout.png` — single spritesheet for paddle, ball, bricks and brick explosions.
- `assets/spritesheet.js` — classic (non-module) script exposing **globals**:
  - `SPRITES` — source rects (`sx, sy, sw, sh`) for `paddle`, `ball`, `blocks.<color>`.
  - `EXPLOSION_FRAMES.<color>` — 4-frame explosion animation per brick color; `EXPLOSION_DURATION = 150` (ms, total animation length).
  - `loadSpritesheet(cb)` — async load, copies image to offscreen canvas, queues callbacks until loaded.
  - `drawSprite(ctx, name, x, y, w, h)` — `name` is `'paddle'`, `'ball'` or `'block_<color>'`.
  - `drawFrame(ctx, frame, x, y, w, h)` — draw a raw frame rect (used for explosions).
  - Brick colors: `gray, red, yellow, cyan, magenta, hotpink, green` (`gray` unused so far).
- Spritesheet path is hardcoded relative (`assets/spritesheet-breakout.png`) → `index.html` must stay at repo root.
- Known quirk: `EXPLOSION_FRAMES.gray` reuses the red frames' coordinates.
- `assets/sounds/ball-bounce.mp3` (wall/paddle), `assets/sounds/break-sound.mp3` (brick) — played via `playSound()`, which restarts `currentTime` and swallows `play()` rejection (autoplay policy).

## Spec-driven workflow

Every feature goes through a spec before code. Skills `spec` and `spec-impl` (from `Klerith/fernando-skills`, locked in `skills-lock.json`, installed in `.claude/skills/`).

1. `/spec <description>` — clarifying questions, then writes `specs/NN-slug.md` (next sequential number, 2 digits) with status `Draft`. Template: `.claude/skills/spec/template.md`.
2. Human reviews and sets status to `Approved` → commit `chore: spec approved`.
3. `/spec-impl NN-slug` — refuses unless status is `Approved`; creates/switches to branch `spec-NN-slug` (auto, per `specs/.spec-config.yml` → `AutoCreateBranch: true`); implements the plan step by step, pausing for diff review. Never auto-commits.
4. One commit per plan step: `feat: <what was added>`.
5. Verify acceptance criteria, tick `[x]`, set status `Implemented` → commit `chore: spec status: Implemented`.
6. Merge via PR to `main`.

Spec conventions (match `specs/01-playable-mvp.md`):

- Written in English; status labels `Draft` / `Approved` / `Implemented` / `Obsolete`.
- Header: `Status`, `Depends on`, `Date`, one-sentence `Objective`.
- Sections: Scope (In / Out of scope), Data model, Implementation plan (numbered, each step leaves the game working + manual test), Acceptance criteria (boolean checklist), Decisions (**Yes:** / **No:** with reason), Risks (table), What is **not** in this spec.
- Implement only what the spec says; out-of-scope requests go to a new spec. Spec changes go in the spec, not silently in code.

Deferred to future specs (per SPEC 01): multiple levels, multi-hit/indestructible bricks, power-ups, ball speed progression, responsive/HiDPI/touch, high-score table, music/volume/mute.

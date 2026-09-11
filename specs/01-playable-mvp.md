# SPEC 01 — Playable Arkanoid MVP

> **Status:** Approved
> **Depends on:** none
> **Date:** 2026-09-11
> **Objective:** Build a playable single-level Arkanoid in plain HTML/CSS/JS with paddle, ball, breakable bricks, lives, score, sounds and a persisted high score.

## Scope

**In:**

- Fixed 480×640 canvas, centered on the page.
- One fixed level: 6 rows × 9 columns of single-hit bricks, one color per row.
- Paddle controlled by keyboard (ArrowLeft/ArrowRight, A/D) and mouse (horizontal position).
- Ball stuck to the paddle until launched with Space or click.
- Paddle bounce angle depends on the impact point.
- Constant ball speed, frame-rate independent (delta-time).
- Score per brick, depending on its row.
- 3 lives. Losing the ball costs one life and returns to serve.
- End screens: game over (0 lives) and win (all bricks broken). Space/click restarts.
- Pause with P or Esc. Auto-pause when the window loses focus.
- Brick explosion animation using `EXPLOSION_FRAMES`.
- Sounds: `ball-bounce.mp3` on paddle/wall bounce, `break-sound.mp3` on brick break.
- High score persisted in localStorage, shown in the HUD.

**Out of scope (for future specs):**

- Multiple levels or level progression.
- Multi-hit bricks (gray) or indestructible bricks.
- Power-ups (capsules, laser, multi-ball, etc.).
- Increasing ball speed.
- Responsive/scaled canvas, HiDPI handling, touch controls.
- High-score table (top N, names, dates).
- Music, volume control, mute toggle.
- ES modules or splitting JS beyond `constants.js` + `game.js`.

## Data model

Constants and `ROWS` live in `constants.js`; `state` lives in `game.js`.

```js
// constants.js
// Logical dimensions (px)
const CANVAS_W = 480, CANVAS_H = 640;
const HUD_H = 40;                       // top band; playfield top wall is y = HUD_H
const BRICK_W = 48, BRICK_H = 24;
const BRICK_COLS = 9, BRICK_ROWS = 6;
const BRICK_OFFSET_X = 24;              // (480 - 9*48) / 2
const BRICK_OFFSET_Y = 80;
const PADDLE_W = 96, PADDLE_H = 12, PADDLE_Y = 600;
const BALL_SIZE = 12;

// Tuning
const PADDLE_SPEED = 480;               // px/s (keyboard)
const BALL_SPEED = 360;                 // px/s, constant
const MAX_BOUNCE_ANGLE = Math.PI / 3;   // 60° from vertical at paddle edges
const MIN_BOUNCE_ANGLE = Math.PI / 12;  // 15° from vertical, ball never travels vertically
const MAX_DT = 1 / 30;                  // s, clamp per frame
const START_LIVES = 3;
const HIGHSCORE_KEY = 'arkanoid:highscore:v1';

// Row layout, top to bottom
const ROWS = [
  { color: 'red',     points: 60 },
  { color: 'yellow',  points: 50 },
  { color: 'cyan',    points: 40 },
  { color: 'magenta', points: 30 },
  { color: 'hotpink', points: 20 },
  { color: 'green',   points: 10 },
];

// game.js
// Game state
const state = {
  phase: 'serve',        // 'serve' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  highScore: 0,
  lives: START_LIVES,
  paddle: { x: 192, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE },
  bricks: [/* { x, y, w, h, color, points, alive } */],
  explosions: [/* { x, y, w, h, color, startTime } */],
  input: { left: false, right: false },
  paddleDir: 1,          // last horizontal paddle direction: -1 left, 1 right (default)
};
```

Conventions:

- Coordinates: origin top-left, x/y are the top-left corner of each rect.
- Velocities in px/s. Movement is `pos += vel * dt`, with `dt` in seconds.
- Maximum possible score: 9 × (60+50+40+30+20+10) = 1890.
- High score is stored as a decimal integer string under `arkanoid:highscore:v1`.

## Implementation plan

1. Create `index.html`, `style.css`, `constants.js` and `game.js` at repo root. `index.html` contains a `<canvas id="game" width="480" height="640">` and loads `assets/spritesheet.js`, `constants.js`, then `game.js` as classic scripts. `style.css` centers the canvas on a dark background. `game.js` calls `loadSpritesheet` and starts a `requestAnimationFrame` loop that clears the canvas. Manual test: open `index.html` via `file://`, see an empty canvas, no console errors.
2. Add constants and `ROWS` to `constants.js`; add `state` and `buildBricks()` to `game.js`. Render the brick grid with `drawSprite(ctx, 'block_<color>', ...)` and a static HUD (`SCORE`, `HI`, `LIVES`). Manual test: 54 bricks visible in 6 colored rows.
3. Render the paddle with `drawSprite(ctx, 'paddle', ...)`. Add keyboard input (keydown/keyup on ArrowLeft/ArrowRight/A/D) and mouse input (`mousemove` on canvas, paddle centered on cursor x, converted via `getBoundingClientRect`). Clamp paddle to `[0, CANVAS_W - PADDLE_W]`. Whenever the paddle x changes, set `state.paddleDir` to the sign of the change. Manual test: paddle moves with both inputs and never leaves the canvas.
4. Add the `serve` phase: ball sits centered on top of the paddle and follows it. Space or click switches to `playing` and launches the ball upward at `BALL_SPEED` with angle `state.paddleDir * MIN_BOUNCE_ANGLE` (`vx = BALL_SPEED * sin(angle)`, `vy = -BALL_SPEED * cos(angle)`). Add delta-time with `MAX_DT` clamp. Ball bounces off left, right and top (`y = HUD_H`) walls. Manual test: ball launches and bounces on walls.
5. Add paddle collision: only when `vy > 0`. Compute `offset = (ballCenterX - paddleCenterX) / (PADDLE_W / 2)` clamped to `[-1, 1]`. New angle = `offset * MAX_BOUNCE_ANGLE`. If `|angle| < MIN_BOUNCE_ANGLE`, set `angle = sign * MIN_BOUNCE_ANGLE`, where `sign` is the sign of `offset`, or `state.paddleDir` when `offset === 0`. Set `vx = BALL_SPEED * sin(angle)`, `vy = -BALL_SPEED * cos(angle)`. Place ball just above the paddle. Manual test: hitting the paddle edges sends the ball sideways; hitting the center with a still paddle never sends it straight up.
6. Add brick collision: AABB test against alive bricks, at most one brick resolved per frame. Reflect `vx` or `vy` based on the smaller overlap axis. Mark brick `alive = false` and add `points` to `state.score`. Manual test: bricks disappear and the HUD score increases by the row value.
7. Add explosions: on brick break push an entry to `state.explosions`. Draw frame `floor(elapsed / (EXPLOSION_DURATION / 4))` from `EXPLOSION_FRAMES[color]` via `drawFrame`. Remove the entry once `elapsed >= EXPLOSION_DURATION`. Manual test: breaking a brick plays a short 4-frame animation.
8. Add lives and end conditions. Ball `y > CANVAS_H` → `lives -= 1`. If `lives > 0` → `serve`, else → `gameover`. No alive bricks left → `win`. Draw overlays: `serve` shows "PRESS SPACE OR CLICK", `gameover` shows "GAME OVER" + score, `win` shows "YOU WIN" + score. In `gameover`/`win`, Space/click calls `resetGame()` (score 0, lives 3, bricks rebuilt, explosions cleared, phase `serve`). Manual test: lose 3 balls → game over; restart works.
9. Add pause: P or Esc toggles `playing` ↔ `paused`. `window` `blur` switches `playing` → `paused`. While paused, no updates run and a "PAUSED" overlay is drawn. Manual test: pausing freezes ball and paddle; resuming continues without a jump.
10. Add sounds: create `Audio` objects for `assets/sounds/ball-bounce.mp3` and `assets/sounds/break-sound.mp3`. `playSound(audio)` resets `currentTime = 0` and calls `play()` with a swallowed rejection. Bounce sound on wall and paddle hits, break sound on brick hits. Manual test: sounds play after the first launch.
11. Add high-score persistence: `loadHighScore()` reads `HIGHSCORE_KEY` inside try/catch, invalid or missing → 0. On entering `gameover` or `win`, if `score > highScore` update `state.highScore` and write it inside try/catch. HUD shows `HI` from `state.highScore`. Manual test: finish a game, reload, `HI` keeps the value.

## Acceptance criteria

- [ ] Opening `index.html` via `file://` loads the game with no console errors.
- [x] The canvas is 480×640 and centered horizontally on the page.
- [x] 54 bricks are drawn in 6 rows of 9, colors top to bottom: red, yellow, cyan, magenta, hotpink, green.
- [x] ArrowLeft/ArrowRight and A/D move the paddle.
- [x] Moving the mouse over the canvas centers the paddle on the cursor x.
- [x] The paddle never goes outside the canvas.
- [x] Before launch, the ball stays on top of the paddle and follows it.
- [x] Space or click launches the ball at ~15° from vertical, toward the last paddle direction (right if the paddle never moved).
- [x] The ball bounces off the left, right and top walls.
- [x] Hitting the paddle center sends the ball at ~15° from vertical; hitting an edge sends it at ~60° from vertical.
- [x] The ball never travels perfectly vertical (no endless top wall ↔ paddle loop with a still paddle).
- [x] Ball speed is the same at 60 Hz and 144 Hz displays.
- [x] A brick disappears after one hit and plays a 4-frame explosion.
- [x] Breaking a red brick adds 60 points; a green brick adds 10 points.
- [x] Losing the ball decrements lives by 1 and returns to serve.
- [x] Losing the third ball shows "GAME OVER" with the final score.
- [x] Breaking all 54 bricks shows "YOU WIN" with the final score (1890).
- [x] Space or click on an end screen starts a new game with score 0, 3 lives and all bricks restored.
- [ ] P or Esc pauses and resumes; the ball does not jump on resume.
- [ ] Switching to another window/tab while playing pauses the game.
- [ ] Bounce sound plays on wall and paddle hits; break sound plays on brick hits.
- [ ] After a game ends with a new record, reloading the page shows it as `HI`.
- [ ] With localStorage blocked, the game still runs and `HI` works for the session.

## Decisions

- **Yes:** two classic scripts `constants.js` + `game.js`, plus `index.html` + `style.css`. Runs from `file://`, no server needed. Top-level `const` in classic scripts is shared across scripts, so `game.js` reads the constants directly.
- **Yes:** `constants.js` holds only immutable config (dimensions, tuning, `ROWS`). Tuning values in one place.
- **No:** `state` in `constants.js`. It is mutable runtime state, belongs with the game logic.
- **No:** ES modules. Would require a static server because of CORS on `file://`.
- **No:** everything inline in `index.html`. Grows badly.
- **Yes:** fixed 480×640 vertical canvas. Classic Arkanoid shape, bricks scale the 32×16 sprite by 1.5×.
- **No:** 800×600 horizontal or responsive canvas. Responsive adds resize and DPR complexity.
- **Yes:** keyboard + mouse controls. Low cost, covers both preferences.
- **Yes:** ball stuck to the paddle until Space/click. Gives the player control and also satisfies the browser's user-interaction requirement for audio.
- **No:** automatic launch with countdown.
- **Yes:** paddle bounce angle based on impact point, max 60°. Gives the player aim control.
- **No:** simple reflection. Produces repetitive loops.
- **Yes:** minimum bounce angle of 15° from vertical, applied to paddle bounces and to the launch. Walls and bricks only reflect, so the paddle is the only place the angle changes; forbidding vertical there removes the top wall ↔ paddle loop.
- **Yes:** launch toward the last paddle direction (right by default). Deterministic and player-controllable.
- **No:** random variation on bounces. Not reproducible, makes manual testing harder.
- **No:** loop detector (N paddle bounces without a brick hit → random nudge). Extra state and randomness for a case the minimum angle already covers.
- **Yes:** constant ball speed with delta-time. Simple and predictable.
- **No:** incremental speed. Deferred.
- **Yes:** single-hit bricks, points by row (60 top → 10 bottom).
- **No:** gray multi-hit bricks. Extra logic, deferred.
- **Yes:** brick stops colliding immediately; explosion is purely visual.
- **Yes:** `EXPLOSION_DURATION` (150 ms) is the total animation length, ~37.5 ms per frame. Literal reading of the constant name.
- **Yes:** pause with P/Esc plus auto-pause on window blur. Avoids large `dt` jumps and unfair ball losses.
- **Yes:** high score in localStorage under versioned key `arkanoid:highscore:v1`, written only at game end. Versioned key allows future schema changes.
- **No:** live high-score updates on every brick. Unnecessary writes.
- **Yes:** Space/click on end screen restarts directly.
- **No:** return to a separate start screen. The `serve` phase already acts as the start screen.
- **Yes:** spec written in English with English state labels (`Draft`, `Approved`…). Convention for all future specs in this repo.

## Risks

| Risk                                                               | Mitigation                                                                             |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Ball tunnels through bricks on a long frame                        | `dt` clamped to `MAX_DT` (1/30 s) → max 12 px per frame, half a brick height.          |
| Ball hits two bricks in the same frame and reflects twice          | Resolve at most one brick collision per frame.                                         |
| Endless vertical loop top wall ↔ paddle (center hit, still paddle) | `MIN_BOUNCE_ANGLE` (15°) on paddle bounces and angled launch; ball never has `vx = 0`. |
| Ball gets stuck inside the paddle                                  | Only collide when `vy > 0`; reposition ball above the paddle after bounce.             |
| Audio blocked before user interaction                              | First sound only happens after Space/click launch; `play()` rejection is swallowed.    |
| Overlapping sounds cut each other                                  | `currentTime = 0` restart accepted for MVP; audio pooling deferred.                    |
| localStorage unavailable (private mode, blocked)                   | try/catch on read/write; fall back to in-memory `state.highScore`.                     |
| Large `dt` after tab switch                                        | Auto-pause on `blur` plus `MAX_DT` clamp.                                              |

## What is **not** in this spec

- Multiple levels.
- Multi-hit or indestructible bricks.
- Power-ups.
- Ball speed progression.
- Responsive canvas, HiDPI, touch controls.
- High-score table with names/dates.
- Music and volume/mute controls.

Each one of those, if it lands, goes in its own spec.

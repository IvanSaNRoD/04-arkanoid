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

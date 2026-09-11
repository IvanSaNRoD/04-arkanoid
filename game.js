// Game state
const state = {
  phase: 'serve',        // 'serve' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  highScore: 0,
  lives: START_LIVES,
  paddle: { x: 192, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE },
  bricks: [],            // { x, y, w, h, color, points, alive }
  explosions: [],        // { x, y, w, h, color, startTime }
  input: { left: false, right: false },
  paddleDir: 1,          // last horizontal paddle direction: -1 left, 1 right (default)
};

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

function buildBricks() {
  const bricks = [];
  for ( let row = 0; row < BRICK_ROWS; row++ ) {
    const { color, points } = ROWS[ row ];
    for ( let col = 0; col < BRICK_COLS; col++ ) {
      bricks.push( {
        x: BRICK_OFFSET_X + col * BRICK_W,
        y: BRICK_OFFSET_Y + row * BRICK_H,
        w: BRICK_W,
        h: BRICK_H,
        color,
        points,
        alive: true,
      } );
    }
  }
  return bricks;
}

function drawBricks() {
  for ( const b of state.bricks ) {
    if ( b.alive ) drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  }
}

function drawHud() {
  ctx.fillStyle = '#222';
  ctx.fillRect( 0, 0, CANVAS_W, HUD_H );

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.textBaseline = 'middle';
  const y = HUD_H / 2;

  ctx.textAlign = 'left';
  ctx.fillText( 'SCORE ' + state.score, 12, y );
  ctx.textAlign = 'center';
  ctx.fillText( 'HI ' + state.highScore, CANVAS_W / 2, y );
  ctx.textAlign = 'right';
  ctx.fillText( 'LIVES ' + state.lives, CANVAS_W - 12, y );
}

function render() {
  ctx.clearRect( 0, 0, CANVAS_W, CANVAS_H );
  drawHud();
  drawBricks();
}

function loop() {
  render();
  requestAnimationFrame( loop );
}

state.bricks = buildBricks();

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );

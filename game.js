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

function drawPaddle() {
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
}

// Clamp to canvas and track last horizontal direction
function setPaddleX( x ) {
  const clamped = Math.max( 0, Math.min( CANVAS_W - PADDLE_W, x ) );
  const delta = clamped - state.paddle.x;
  if ( delta !== 0 ) state.paddleDir = Math.sign( delta );
  state.paddle.x = clamped;
}

const KEYS_LEFT = [ 'ArrowLeft', 'KeyA' ];
const KEYS_RIGHT = [ 'ArrowRight', 'KeyD' ];

function drawBall() {
  const b = state.ball;
  drawSprite( ctx, 'ball', b.x, b.y, b.size, b.size );
}

// Ball centered on top of the paddle
function stickBallToPaddle() {
  const p = state.paddle;
  const b = state.ball;
  b.x = p.x + p.w / 2 - b.size / 2;
  b.y = p.y - b.size;
}

function launchBall() {
  const angle = state.paddleDir * MIN_BOUNCE_ANGLE;
  state.ball.vx = BALL_SPEED * Math.sin( angle );
  state.ball.vy = -BALL_SPEED * Math.cos( angle );
  state.phase = 'playing';
}

// Space / click
function onAction() {
  if ( state.phase === 'serve' ) launchBall();
}

function onKey( e, pressed ) {
  if ( KEYS_LEFT.includes( e.code ) ) state.input.left = pressed;
  else if ( KEYS_RIGHT.includes( e.code ) ) state.input.right = pressed;
  else if ( e.code === 'Space' ) {
    if ( pressed && !e.repeat ) onAction();
  }
  else return;
  e.preventDefault();
}

window.addEventListener( 'keydown', ( e ) => onKey( e, true ) );
window.addEventListener( 'keyup', ( e ) => onKey( e, false ) );

canvas.addEventListener( 'mousemove', ( e ) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  setPaddleX( mouseX - PADDLE_W / 2 );
} );

canvas.addEventListener( 'click', onAction );

function updateBall( dt ) {
  const b = state.ball;
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // Walls: left, right, top (HUD bottom edge)
  if ( b.x < 0 ) {
    b.x = 0;
    b.vx = Math.abs( b.vx );
  } else if ( b.x + b.size > CANVAS_W ) {
    b.x = CANVAS_W - b.size;
    b.vx = -Math.abs( b.vx );
  }
  if ( b.y < HUD_H ) {
    b.y = HUD_H;
    b.vy = Math.abs( b.vy );
  }
}

function update( dt ) {
  const dir = ( state.input.right ? 1 : 0 ) - ( state.input.left ? 1 : 0 );
  if ( dir !== 0 ) setPaddleX( state.paddle.x + dir * PADDLE_SPEED * dt );

  if ( state.phase === 'serve' ) stickBallToPaddle();
  else if ( state.phase === 'playing' ) updateBall( dt );
}

function render() {
  ctx.clearRect( 0, 0, CANVAS_W, CANVAS_H );
  drawHud();
  drawBricks();
  drawPaddle();
  drawBall();
}

let lastTime = null;

function loop( now ) {
  const dt = lastTime === null ? 0 : Math.min( ( now - lastTime ) / 1000, MAX_DT );
  lastTime = now;
  update( dt );
  render();
  requestAnimationFrame( loop );
}

state.bricks = buildBricks();

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );

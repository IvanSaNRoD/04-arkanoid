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

const bounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );

// Restart from the beginning; rejection (autoplay policy) is ignored
function playSound( audio ) {
  audio.currentTime = 0;
  audio.play().catch( () => {} );
}

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

function resetGame() {
  state.score = 0;
  state.lives = START_LIVES;
  state.bricks = buildBricks();
  state.explosions = [];
  state.phase = 'serve';
}

// Space / click
function onAction() {
  if ( state.phase === 'serve' ) launchBall();
  else if ( state.phase === 'gameover' || state.phase === 'win' ) resetGame();
}

// P / Esc
function togglePause() {
  if ( state.phase === 'playing' ) state.phase = 'paused';
  else if ( state.phase === 'paused' ) state.phase = 'playing';
}

function onKey( e, pressed ) {
  if ( KEYS_LEFT.includes( e.code ) ) state.input.left = pressed;
  else if ( KEYS_RIGHT.includes( e.code ) ) state.input.right = pressed;
  else if ( e.code === 'Space' ) {
    if ( pressed && !e.repeat ) onAction();
  }
  else if ( e.code === 'KeyP' || e.code === 'Escape' ) {
    if ( pressed && !e.repeat ) togglePause();
  }
  else return;
  e.preventDefault();
}

window.addEventListener( 'keydown', ( e ) => onKey( e, true ) );
window.addEventListener( 'keyup', ( e ) => onKey( e, false ) );

window.addEventListener( 'blur', () => {
  if ( state.phase === 'playing' ) state.phase = 'paused';
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  if ( state.phase === 'paused' ) return;
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
  let hitWall = false;
  if ( b.x < 0 ) {
    b.x = 0;
    b.vx = Math.abs( b.vx );
    hitWall = true;
  } else if ( b.x + b.size > CANVAS_W ) {
    b.x = CANVAS_W - b.size;
    b.vx = -Math.abs( b.vx );
    hitWall = true;
  }
  if ( b.y < HUD_H ) {
    b.y = HUD_H;
    b.vy = Math.abs( b.vy );
    hitWall = true;
  }
  if ( hitWall ) playSound( bounceSound );

  collideBricks();
  collidePaddle();
}

// At most one brick per frame; reflect on the axis with the smaller overlap
function collideBricks() {
  const b = state.ball;
  for ( const r of state.bricks ) {
    if ( !r.alive || !overlaps( b, r ) ) continue;

    const overlapX = Math.min( b.x + b.size, r.x + r.w ) - Math.max( b.x, r.x );
    const overlapY = Math.min( b.y + b.size, r.y + r.h ) - Math.max( b.y, r.y );
    if ( overlapX < overlapY ) b.vx = -b.vx;
    else b.vy = -b.vy;

    r.alive = false;
    state.score += r.points;
    state.explosions.push( { x: r.x, y: r.y, w: r.w, h: r.h, color: r.color, startTime: performance.now() } );
    playSound( breakSound );
    return;
  }
}

// Purely visual: 4 frames over EXPLOSION_DURATION, removed when finished
function drawExplosions() {
  const now = performance.now();
  const frameTime = EXPLOSION_DURATION / 4;
  state.explosions = state.explosions.filter( ( ex ) => now - ex.startTime < EXPLOSION_DURATION );
  for ( const ex of state.explosions ) {
    const frame = EXPLOSION_FRAMES[ ex.color ][ Math.floor( ( now - ex.startTime ) / frameTime ) ];
    drawFrame( ctx, frame, ex.x, ex.y, ex.w, ex.h );
  }
}

function overlaps( a, r ) {
  return a.x < r.x + r.w && a.x + a.size > r.x &&
         a.y < r.y + r.h && a.y + a.size > r.y;
}

// Angle depends on impact point, never closer to vertical than MIN_BOUNCE_ANGLE
function collidePaddle() {
  const b = state.ball;
  const p = state.paddle;
  if ( b.vy <= 0 || !overlaps( b, p ) ) return;

  const ballCenterX = b.x + b.size / 2;
  const paddleCenterX = p.x + p.w / 2;
  const offset = Math.max( -1, Math.min( 1, ( ballCenterX - paddleCenterX ) / ( PADDLE_W / 2 ) ) );

  let angle = offset * MAX_BOUNCE_ANGLE;
  if ( Math.abs( angle ) < MIN_BOUNCE_ANGLE ) {
    const sign = offset === 0 ? state.paddleDir : Math.sign( offset );
    angle = sign * MIN_BOUNCE_ANGLE;
  }

  b.vx = BALL_SPEED * Math.sin( angle );
  b.vy = -BALL_SPEED * Math.cos( angle );
  b.y = p.y - b.size;
  playSound( bounceSound );
}

function update( dt ) {
  if ( state.phase === 'paused' ) return;

  const dir = ( state.input.right ? 1 : 0 ) - ( state.input.left ? 1 : 0 );
  if ( dir !== 0 ) setPaddleX( state.paddle.x + dir * PADDLE_SPEED * dt );

  if ( state.phase === 'serve' ) stickBallToPaddle();
  else if ( state.phase === 'playing' ) {
    updateBall( dt );
    checkEndConditions();
  }
}

function checkEndConditions() {
  if ( state.ball.y > CANVAS_H ) {
    state.lives -= 1;
    state.phase = state.lives > 0 ? 'serve' : 'gameover';
  } else if ( !state.bricks.some( ( r ) => r.alive ) ) {
    state.phase = 'win';
  }
}

function drawCenteredText( text, y, size ) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + size + 'px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText( text, CANVAS_W / 2, y );
}

function drawOverlay() {
  if ( state.phase === 'serve' ) {
    drawCenteredText( 'PRESS SPACE OR CLICK', 400, 18 );
    return;
  }

  if ( state.phase === 'paused' ) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect( 0, HUD_H, CANVAS_W, CANVAS_H - HUD_H );
    drawCenteredText( 'PAUSED', 320, 36 );
    return;
  }

  const title = { gameover: 'GAME OVER', win: 'YOU WIN' }[ state.phase ];
  if ( !title ) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, HUD_H, CANVAS_W, CANVAS_H - HUD_H );
  drawCenteredText( title, 300, 36 );
  drawCenteredText( 'SCORE ' + state.score, 350, 20 );
  drawCenteredText( 'PRESS SPACE OR CLICK', 400, 14 );
}

function render() {
  ctx.clearRect( 0, 0, CANVAS_W, CANVAS_H );
  drawHud();
  drawBricks();
  drawExplosions();
  drawPaddle();
  if ( state.phase !== 'gameover' && state.phase !== 'win' ) drawBall();
  drawOverlay();
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

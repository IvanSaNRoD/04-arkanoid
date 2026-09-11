const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
}

function loop() {
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  requestAnimationFrame( loop );
} );

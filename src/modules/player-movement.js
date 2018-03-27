define([], () => {
  // Control the movement of the main player via keyboard keys.
  class PlayerMovement {
    constructor(camera) {
      this.forwardSpeed = 0.5;
      this.backwardSpeed = Math.round(this.forwardSpeed / 3 * 100) / 100;
      this.turnSpeed = Math.round((4 * Math.PI / 180) * 100) / 100;
      this.key = {
        up: 38,
        w: 87,
        down: 40,
        s: 83,
        left: 37,
        a: 65,
        right: 39,
        d: 68,
      };

      window.document.addEventListener('keydown', (e) => {
        this.onKeyDown(e, camera);
      }, false);
    }

    onKeyDown(e, camera) {
      switch (e.keyCode) {
        case this.key.up:
        case this.key.w:
          camera.translateZ(- this.forwardSpeed);
          break;
        case this.key.down:
        case this.key.s:
          camera.translateZ(this.backwardSpeed);
          e.preventDefault(); // Prevent the whole page scrolling down when using the down arrow key.
          break;
        case this.key.left:
        case this.key.a:
          camera.rotation.y += this.turnSpeed;
          break;
        case this.key.right:
        case this.key.d:
          camera.rotation.y -= this.turnSpeed;
          break;
      }
    }
  }

  return PlayerMovement;
});

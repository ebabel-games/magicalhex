define([], () => {
  // Control the movement of the main player via keyboard keys.
  class PlayerMovement {
    constructor(camera) {
      this.forwardSpeed = 0.05;
      this.backwardSpeed = Math.round(this.forwardSpeed / 3 * 100) / 100;
      this.turnSpeed = Math.round((2 * Math.PI / 180) * 100) / 100;
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
      this.moveForward = false;
      this.moveBackward = false;
      this.turnLeft = false;
      this.turnRight = false;
      this.camera = camera;

      window.document.addEventListener('keydown', (e) => {
        this.setDirection(e, true);
      }, false);

      window.document.addEventListener('keyup', (e) => {
        this.setDirection(e, false);
      }, false);
    }

    update() {
      if (this.moveForward) {
        this.camera.translateZ(- this.forwardSpeed);
      }

      if (this.moveBackward) {
        this.camera.translateZ(this.backwardSpeed);
      }

      if (this.turnLeft) {
        this.camera.rotation.y += this.turnSpeed;
      }

      if (this.turnRight) {
        this.camera.rotation.y -= this.turnSpeed;
      }
    }

    // More than one direction can be enabled, so it's possible to press on several keys like forwards and a bit left or right.
    setDirection(e, isEnabled) {
      switch (e.keyCode) {
        case this.key.up:
        case this.key.w:
          this.moveForward = isEnabled;
          break;
        case this.key.down:
        case this.key.s:
          this.moveBackward = isEnabled;
          e.preventDefault(); // Prevent the whole page scrolling down when using the down arrow key.
          break;
        case this.key.left:
        case this.key.a:
          this.turnLeft = isEnabled;
          break;
        case this.key.right:
        case this.key.d:
          this.turnRight = isEnabled;
          break;
      }
    }
  }

  return PlayerMovement;
});

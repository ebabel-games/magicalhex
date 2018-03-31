define(['constants'], (C) => {
  // Control the movement of the main player via keyboard keys.
  class PlayerMovement {
    constructor(camera) {
      this.forwardSpeed = C.PLAYER_FORWARD_SPEED;
      this.backwardSpeed = Math.round(C.PLAYER_FORWARD_SPEED / C.PLAYER_BACKWARD_SPEED_SLOWING_FACTOR * 100) / 100;
      this.turnSpeed = C.PLAYER_TURN_SPEED;
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
        case C.KEY.UP:
        case C.KEY.W:
          this.moveForward = isEnabled;
          break;
        case C.KEY.DOWN:
        case C.KEY.S:
          this.moveBackward = isEnabled;
          e.preventDefault(); // Prevent the whole page scrolling down when using the down arrow key.
          break;
        case C.KEY.LEFT:
        case C.KEY.A:
          this.turnLeft = isEnabled;
          break;
        case C.KEY.RIGHT:
        case C.KEY.D:
          this.turnRight = isEnabled;
          break;
        case C.KEY.ESC:
          document.dispatchEvent(new CustomEvent(C.EVENTS.TOGGLE_STATS));
          break;
        case C.KEY.BACKTICK_TILDE:
          document.dispatchEvent(new CustomEvent(C.EVENTS.TOGGLE_DEBUG));
          break;
      }
    }
  }

  return PlayerMovement;
});

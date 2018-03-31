define(['constants', 'round'], (C, round) => {
  // Control the movement of the main player via keyboard keys.
  class PlayerMovement {
    constructor(camera) {
      this.forwardSpeed = C.PLAYER_FORWARD_SPEED;
      this.backwardSpeed = round(C.PLAYER_FORWARD_SPEED / C.PLAYER_BACKWARD_SPEED_SLOWING_FACTOR, 2);
      this.turnSpeed = C.PLAYER_TURN_SPEED;
      this.moveForward = false;
      this.moveBackward = false;
      this.turnLeft = false;
      this.turnRight = false;
      this.camera = camera;
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
  }

  return PlayerMovement;
});

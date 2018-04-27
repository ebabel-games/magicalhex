define(['constants', 'adjust-player-y'], (C, adjustPlayerY) => {
  // Control the movement of the main player via keyboard keys.
  class PlayerMovement {
    constructor(camera) {
      this.forwardSpeed = C.PLAYER_FORWARD_SPEED;
      this.backwardSpeed = C.PLAYER_BACKWARD_SPEED;
      this.turnSpeed = C.PLAYER_TURN_SPEED;
      this.moveForward = false;
      this.moveBackward = false;
      this.turnLeft = false;
      this.turnRight = false;
      this.camera = camera;
    }

    update(currentZone) {
      if (this.moveForward || this.moveBackward) {
        const newY = adjustPlayerY(currentZone, this.camera);
        document.getElementById('targetName').innerText = newY;
        this.camera.position.y = newY;
      }

      if (this.moveForward) {
        this.camera.translateZ(-this.forwardSpeed);
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

    persist() {
      localStorage[C.PERSIST.CAMERA_X] = this.camera.position.x;
      localStorage[C.PERSIST.CAMERA_Y] = this.camera.position.y;
      localStorage[C.PERSIST.CAMERA_Z] = this.camera.position.z;
      localStorage[C.PERSIST.CAMERA_ROTATION_Y] = this.camera.rotation.y;
    }
  }

  return PlayerMovement;
});

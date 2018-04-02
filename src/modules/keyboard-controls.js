define(['constants', 'round', 'player-movement'], (C, round, PlayerMovement) => {
  // Control the movement of the main player via keyboard keys.
  class KeyboardControls {
    constructor(camera, loadedZones, scene) {
      this.playerMovement = new PlayerMovement(camera);

      document.addEventListener('keydown', (e) => {
        this.handleKey(e, true, camera, loadedZones, scene);
      }, false);

      document.addEventListener('keyup', (e) => {
        this.handleKey(e, false, camera, loadedZones, scene);
      }, false);

      return this;
    }

    handleKey(e, isEnabled, camera, loadedZones, scene) {
      switch (e.keyCode) {
        case C.KEY.UP:
        case C.KEY.W:
          this.playerMovement.moveForward = isEnabled;
          break;
        case C.KEY.DOWN:
        case C.KEY.S:
          this.playerMovement.moveBackward = isEnabled;
          e.preventDefault(); // Prevent the whole page scrolling down when using the down arrow key.
          break;
        case C.KEY.LEFT:
        case C.KEY.A:
          this.playerMovement.turnLeft = isEnabled;
          break;
        case C.KEY.RIGHT:
        case C.KEY.D:
          this.playerMovement.turnRight = isEnabled;
          break;
        case C.KEY.ESC:
          if (e.type === 'keyup') { break; }
          document.dispatchEvent(new CustomEvent(C.EVENTS.TOGGLE_STATS));
          break;
        case C.KEY.G:
          if (e.type === 'keyup') { break; }
          document.dispatchEvent(new CustomEvent(C.EVENTS.TOGGLE_GRID, {
            detail: {
              x: camera.position.x,
              z: camera.position.z,
              loadedZones,
              scene,
            },
          }));
          break;
        case C.KEY.BACKTICK_TILDE:
          if (e.type === 'keyup') { break; }
          document.dispatchEvent(new CustomEvent(C.EVENTS.TOGGLE_DEBUG));
          break;
        case C.KEY.SEVEN:
          if (e.type === 'keyup') { break; }
          document.dispatchEvent(new CustomEvent(C.EVENTS.CAST_SPELL_GATE, {
            detail: {camera},
          }));
          break;
      }
    }
  }

  return KeyboardControls;
});

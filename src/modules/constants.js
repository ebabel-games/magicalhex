define([], () => {
  const constants = {
    PLAYER_FORWARD_SPEED: 0.1,
    PLAYER_BACKWARD_SPEED_SLOWING_FACTOR: 3,  // Player moves backward 3 times slower than forward.
    PLAYER_TURN_SPEED: 0.03, // Math.round((2 * Math.PI / 180) * 100) / 100 - note: this is not related to backward speed slowing factor.
    DEBUG_FORWARD_SPEED: 1,
    DEBUG_BACKWARD_SPEED: 1,
    POSITION_DISPLAY_DECIMALS: 1, // How many decimals to display to the player. Only round at the last possible moment.
    KEY: {
      UP: 38,
      W: 87,
      DOWN: 40,
      S: 83,
      LEFT: 37,
      A: 65,
      RIGHT: 39,
      D: 68,
      ESC: 27,
      BACKTICK_TILDE: 192,
    },
    UI: {
      LOADING: 'loading',
      PLAY: 'play',
      GAME: 'game',
      DEBUG_PANEL: 'debug-panel',
      DEBUG_X: 'debugX',
      DEBUG_Z: 'debugZ',
    },
    EVENTS: {
      TOGGLE_STATS: 'toggle-stats',
      TOGGLE_DEBUG: 'toggle-debug',
    },
    STATS_PANEL: {
      FPS: 0,
      MS: 1,
      MB: 2,
    },
    FOG: {
      COLOR: 0x9db3b5,
      DENSITY: 0.025,
    },
    CAMERA: {
      FOV: 45, // Vertical field of view.
      RATIO: window.innerWidth / window.innerHeight, // Aspect ratio.
      NEAR: 0.1, // How near the camera can still see something.
      FAR: 75, // How far the camera can see.
      X: 0, // Default starting position.
      Y: 2,
      Z: 15,
    },
    SUNLIGHT: {
      COLOR: 0xffff00,
      INTENSITY: 0.75,
      X: -1,
      Y: 1,
      Z: 0,
      NAME: 'sunlight',
    },
  };

  return constants;
});

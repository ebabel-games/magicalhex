define([], () => {
  const constants = {
    PLAYER_FORWARD_SPEED: 0.1,
    PLAYER_BACKWARD_SPEED: 0.03,  // Player moves backward 3 times slower than forward.
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
      SEVEN: 55,
      G: 71,
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
      CAST_SPELL_GATE: 'cast-spell-gate',
      TOGGLE_GRID: 'toggle-grid',
    },
    STATS_PANEL: {
      FPS: 0,
      MS: 1,
      MB: 2,
    },
    FOG: {
      COLOR: 0x779977,
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
      ROTATION: {
        X: 0,
        Y: 0,
        Z: 0,
      },
    },
    ZONE_SIZE: 1000,
    ZONE_BUFFER: 100, // Defines the area near a zone line where the game needs to load an contiguous zone.
    AMBIENT_LIGHT: {
      COLOR: 0xccffcc,
      INTENSITY: 1,
    },
    GROUND: {
      X: 0,
      Y: 0,
      Z: 0,
    },
    GRID: {
      LINES_HEIGHT: 500,
      LINES_WIDTH: 500,
      COLOR: 0x00DD6C,
      OPACITY: 0.2,
      X: 0,
      Y: 0.01,
      Z: 0,
    },
    TRUNK: {
      Y: 0.5,               // Default position y. Half of the height if it is to sit on the ground.
      V: 0,                 // Vertical rotation along the y axis. Unit in radians (not degrees).
      RADIUS_TOP: 0.5,      // Radius of the cylinder at the top.
      RADIUS_BOTTOM: 0.5,   // Radius of the cylinder at the bottom.
      HEIGHT: 1,            // Height of the cylinder.
      RADIAL_SEGMENTS: 5,   // Number of segmented faces around the circumference of the cylinder.
      HEIGHT_SEGMENTS: 1,   // Number of rows of faces along the height of the cylinder.
    },
    WALL: {
      Y: 3,
      WIDTH: 2,
      HEIGHT: 6,
      DEPTH: 2,
    },
    PERSIST: {
      CAMERA_X: 'CAMERA_X',
      CAMERA_Y: 'CAMERA_Y',
      CAMERA_Z: 'CAMERA_Z',
      CAMERA_ROTATION_Y: 'CAMERA_ROTATION_Y',
    },
  };

  return constants;
});

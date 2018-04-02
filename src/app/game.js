requirejs.config({
  baseUrl: 'modules',
  paths: {
      app: '../app'
  }
});

// Start the main app logic.
requirejs(
  ['constants', 'toggle-loading', 'toggle-grid', 'animate', 'sky', 'keyboard-controls', 'zone', 'setup-stats-panel', 'setup-debug-panel', 'setup-spell-gate'],
  (C, toggleLoading, toggleGrid, animate, sky, KeyboardControls, Zone, setupStatsPanel, setupDebugPanel, setupSpellGate) => {
    // Register the event listeners (only once) of the toggle functions.
    toggleLoading();
    toggleGrid();
    setupSpellGate();
    const statsPanel = setupStatsPanel();

    // todo: enable clicking on meshes.
    const raycaster = new THREE.Raycaster();

    // todo: use the Clock to calculate delta and make sure animate runs at a consistent speed rather than be reliant on CPU.
    const clock = new THREE.Clock();

    // Initialize a three.js scene.
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C.FOG.COLOR, C.FOG.DENSITY);

    // Camera setup.
    const camera = new THREE.PerspectiveCamera(C.CAMERA.FOV, C.CAMERA.RATIO, C.CAMERA.NEAR, C.CAMERA.FAR);
    camera.name = 'player-camera';

    // Read position of the camera based on the previous game.
    // This will in turn have an impact on starting the new game in the correct zone and location.
    camera.position.set(
      parseFloat(localStorage[C.PERSIST.CAMERA_X]) || C.CAMERA.X,
      parseFloat(localStorage[C.PERSIST.CAMERA_Y]) || C.CAMERA.Y,
      parseFloat(localStorage[C.PERSIST.CAMERA_Z]) || C.CAMERA.Z
    );
    camera.rotation.y = parseFloat(localStorage[C.PERSIST.CAMERA_ROTATION_Y]) || C.CAMERA.ROTATION.Y;

    // Relative sky is always in front of the camera, wherever the camera is pointing.
    // The sky stays perpendicular to the ground and always at the same distance from the camera.
    const relativeSky = sky();
    camera.add(relativeSky);
    relativeSky.position.set(0, 498, 0 - C.CAMERA.FAR);  // x, y, z relative to the camera position.

    // Only add the camera to the scene after the sky has been added to the camera.
    scene.add(camera);

    // Initialize the currentZone as null (will be set in animate.js) and the collection of zones already loaded as empty.
    const currentZone = null;
    const loadedZones = [];

    // Initialize player movement.
    const keyboardControls = new KeyboardControls(camera, loadedZones, scene);

    // Listen for toggling of the debug mode.
    setupDebugPanel(keyboardControls);

    // Overall ambient light.
    const ambientLight = new THREE.AmbientLight(C.AMBIENT_LIGHT.COLOR, C.AMBIENT_LIGHT.INTENSITY);
    ambientLight.name = 'overall-ambient-light';
    scene.add(ambientLight);

    // Create a canvas where everything 3D will be rendered.
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Kickstarts the animation.
    animate(renderer, scene, camera, keyboardControls, statsPanel, currentZone, loadedZones);
  });

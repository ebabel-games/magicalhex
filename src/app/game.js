requirejs.config({
  baseUrl: 'modules',
  paths: {
      app: '../app'
  }
});

// Start the main app logic.
requirejs(
  ['constants', 'toggle-loading', 'light', 'animate', 'sky', 'player-movement', 'zone', 'setup-stats-panel', 'setup-debug-panel'],
  (C, toggleLoading, Light, animate, sky, PlayerMovement, Zone, setupStatsPanel, setupDebugPanel) => {
    toggleLoading();
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
    camera.position.set(C.CAMERA.X, C.CAMERA.Y, C.CAMERA.Z);
    // todo: read the position of the camera based on previous games by using localStorage.
    // This will in turn have an impact on starting the new game in the correct zone and location.

    // Relative sky is always in front of the camera, wherever the camera is pointing.
    // The sky stays perpendicular to the ground and always at the same distance from the camera.
    const relativeSky = sky();
    camera.add(relativeSky);
    relativeSky.position.set(0, 498, 0 - C.CAMERA.FAR);  // x, y, z relative to the camera position.

    // Only add the camera to the scene after the sky has been added to the camera.
    scene.add(camera);

    // Load the data of the current zone to build its static meshes.
    const zone = new Zone(camera.position.x, camera.position.z);
    scene.add(zone.meshes);

    // Initialize player movement.
    const playerMovement = new PlayerMovement(camera);

    // Overall world lighting.
    const sunlight = new Light();
    scene.add(sunlight);

    const debugPanel = setupDebugPanel(playerMovement);

    // Create a canvas where everything 3D will be rendered.
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Kickstarts the animation.
    animate(renderer, scene, camera, playerMovement, statsPanel);
  });

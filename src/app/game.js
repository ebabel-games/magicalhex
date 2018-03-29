requirejs.config({
  baseUrl: 'modules',
  paths: {
      app: '../app'
  }
});

// Start the main app logic.
requirejs(
  ['toggle-loading', 'light', 'animate', 'sky', 'player-movement', 'zone'],
  (toggleLoading, Light, animate, sky, PlayerMovement, Zone) => {
    toggleLoading();

    // todo: enable clicking on meshes.
    const raycaster = new THREE.Raycaster();

    // todo: use the Clock to calculate delta and make sure animate runs at a consistent speed rather than be reliant on CPU.
    const clock = new THREE.Clock();

    // Initialize a three.js scene.
    const scene = new THREE.Scene();

    // Fog: color and density.
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.025);

    // Camera setup.
    const cameraFov = 45; // Vertical field of view.
    const cameraAspect = window.innerWidth / window.innerHeight;  // Aspect ratio.
    const cameraNear = 1; // How near the camera can still show something.
    const cameraFar = 75; // How far the camera cana see.
    const camera = new THREE.PerspectiveCamera(cameraFov, cameraAspect, cameraNear, cameraFar);
    camera.position.set(0, 2, 15);  // x, y, z relative to the scene origin.
    // todo: read the position of the camera based on previous games by using localStorage. This will in turn have an impact on starting the new game in the correct zone and location.

    // Relative sky is always in front of the camera, wherever the camera is pointing.
    // The sky stays perpendicular to the ground and always at the same distance from the camera.
    const relativeSky = sky();
    camera.add(relativeSky);
    relativeSky.position.set(0, 498, 0 - cameraFar);  // x, y, z relative to the camera position.

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

    // Create a canvas where everything 3D will be rendered.
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Kickstarts the animation.
    animate(renderer, scene, camera, playerMovement);
  });

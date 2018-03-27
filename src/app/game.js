requirejs.config({
  baseUrl: 'modules',
  paths: {
      app: '../app'
  }
});

// Start the main app logic.
requirejs(
  ['animate', 'ground', 'sky', 'player-movement', 'static-meshes'],
  (animate, ground, sky, PlayerMovement, StaticMeshes) => {
    // Initialize a three.js scene and camera.
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

    // Relative sky is always in front of the camera, wherever the camera is pointing.
    // The sky stays perpendicular to the ground and always at the same distance from the camera.
    const relativeSky = sky();
    camera.add(relativeSky);
    relativeSky.position.set(0, 498, 0 - cameraFar);  // x, y, z relative to the camera position.

    // Only add the camera to the scene after the sky has been added to the camera.
    scene.add(camera);

    // Initialize player movement.
    const playerMovement = new PlayerMovement(camera);

    // Overall world lighting.
    const firstLight = new THREE.DirectionalLight(0xccff20, 0.2);
    firstLight.position.set(10, 10, 10);
    const secondLight = new THREE.DirectionalLight(0xccff20, 0.2);
    secondLight.position.set(-10, 10, -10);
    scene.add(new THREE.HemisphereLight(0xffffcc, 0x080820, 0.2));
    scene.add(firstLight);
    scene.add(secondLight);

    // Create a canvas where everything 3D will be rendered.
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Ground.
    const staticGround = ground();
    scene.add(staticGround);
    
    // Place all the static meshes in the origin square.
    const originStaticMeshes = new StaticMeshes();
    scene.add(originStaticMeshes);

    // Kickstarts the animation.
    animate(renderer, scene, camera, playerMovement);
  });

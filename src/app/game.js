requirejs.config({
  baseUrl: 'modules',
  paths: {
      app: '../app'
  }
});

// Start the main app logic.
requirejs(
  ['cube', 'animate', 'ground', 'sky', 'player-movement'],
  (cube, animate, ground, sky, playerMovement) => {
    // Initialize a three.js scene and camera.
    const scene = new THREE.Scene();

    // Fog: color and density.
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.025);

    // Camera starting point.
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 75);
    camera.position.y = 5;
    camera.position.z = 15;
    scene.add(camera);

    // Initialize player movement.
    playerMovement(camera);

    // Overall world lighting.
    const lights = [
      { light:  new THREE.HemisphereLight(0xffffcc, 0x080820, 0.2) },
      { light: new THREE.DirectionalLight(0xccff20, 0.2), position: { x: 10, y: 10, z: 10 } },
      { light: new THREE.DirectionalLight(0xccff20, 0.2), position: { x: -10, y: 10, z: -10 } }
    ].map((toAdd) => {
      if (toAdd.position) {
        toAdd.light.position.set(toAdd.position.x, toAdd.position.y, toAdd.position.z);
      }
      scene.add(toAdd.light);
    });

    // Create a canvas where everything 3D will be rendered.
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Plain cube.
    const plainCube = cube();
    plainCube.position.y = 2;
    scene.add(plainCube);

    // Wireframe cube.
    const wireframeCube = cube(2, true, 0xffcc00);
    wireframeCube.position.y = 2;
    scene.add(wireframeCube);

    // Static cubes.
    const staticCubes = new Array(20).fill({}).map(input => {
      const staticCube = cube(1, false, 0x7b3612);

      staticCube.position.x = Math.round(Math.random() * 40 - 20);
      staticCube.position.y = Math.round((Math.random() * 0.75 + 0.5) * 10) / 10;
      staticCube.position.z = Math.round(Math.random() * -35) - 15;

      scene.add(staticCube);

      return staticCube;
    });

    // Ground.
    const staticGround = ground();
    scene.add(staticGround);

    // Sky: always in front of the camera, wherever the camera is pointing.
    // The sky stays perpendicular to the ground and always at the same distance from the camera.
    const relativeSky = sky(camera);
    scene.add(relativeSky);

    // Kickstarts the animation.
    animate(renderer, scene, camera, plainCube, wireframeCube);
  });

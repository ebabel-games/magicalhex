requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: 'modules',
  //except, if the module ID starts with "app",
  //load it from the app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.
  paths: {
      app: '../app'
  }
});

// Start the main app logic.
requirejs(['cube', 'animate'],
function   (cube, animate) {
  // Initialize a three.js scene and camera.
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 5;
  
  // Create a canvas where everything 3D will be rendered.
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Plain cube.
  const plainCube = cube();
  scene.add(plainCube);

  // Wireframe cube.
  const wireframeCube = cube(2, true, 0xffcc00);
  scene.add(wireframeCube);

  // Kickstarts the animation.
  animate(renderer, scene, camera, plainCube, wireframeCube);
});

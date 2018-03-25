function Cube(size = 1, wireframe = false, color = 0xff0000) {
  const box = new THREE.BoxGeometry(size, size, size);
  let geometry = box;
  let material;

  if (wireframe) {
    geometry = new THREE.WireframeGeometry(box);
    material = new THREE.LineBasicMaterial({ color, lineWidth: 4 });
    return new THREE.LineSegments(geometry, material);
  }
  
  material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

((THREE) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  // Plain cube.
  const plainCube = new Cube();
  scene.add(plainCube);

  // Wireframe cube.
  const wireframeCube = new Cube(2, true, 0xffcc00);
  scene.add(wireframeCube);

  camera.position.z = 5;

  function animate() {
    // First line of animate, to ensure a smooth animation.
    requestAnimationFrame(animate);

    plainCube.rotation.x += 0.02;
    plainCube.rotation.y += 0.02;

    wireframeCube.rotation.x += 0.01;
    wireframeCube.rotation.y += 0.01;

    // Last line of animation, to render all changes.
    renderer.render( scene, camera );
  }
  animate();

})(THREE);

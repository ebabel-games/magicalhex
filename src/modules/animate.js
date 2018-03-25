define([], () => {
  // Animation that keeps getting called to render everything and all changes.
  const animate = (renderer, scene, camera, plainCube, wireframeCube) => {
    // First line of animate, to ensure a smooth animation.
    requestAnimationFrame((timestamp) =>
      animate(renderer, scene, camera, plainCube, wireframeCube));

    plainCube.rotation.x += 0.02;
    plainCube.rotation.y += 0.02;

    wireframeCube.rotation.x += 0.01;
    wireframeCube.rotation.y += 0.01;

    // Last line of animation, to render all changes.
    renderer.render(scene, camera);
  }

  return animate;
});

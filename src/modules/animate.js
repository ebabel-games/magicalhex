define([], () => {
  // Animation that keeps getting called to render everything and all changes.
  const animate = (renderer, scene, camera, playerMovement) => {
    // First line of animate, to ensure a smooth animation.
    requestAnimationFrame((timestamp) => animate(renderer, scene, camera, playerMovement));

    // Set window.debug to switch from normal gameplay to super powered.
    if (window.debug) {
      playerMovement.forwardSpeed = 1;
      playerMovement.backwardSpeed = 1;
    }

    // Test animations, these should be made generic, like a list of everything that needs animating and each item documenting how it should be animated.
    const plainCube = scene.getObjectByName('plain-cube');
    plainCube.rotation.x += 0.02;
    plainCube.rotation.y += 0.02;
    const wireframeCube = scene.getObjectByName('wireframe-cube');
    wireframeCube.rotation.x += 0.01;
    wireframeCube.rotation.y += 0.01;

    playerMovement.update();

    // Last line of animation, to render all changes.
    renderer.render(scene, camera);
  }

  return animate;
});

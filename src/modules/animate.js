define(['update-debug-panel'], (updateDebugPanel) => {
  // Animation that keeps getting called to render everything and all changes.
  const animate = (renderer, scene, camera, playerMovement, statsPanel) => {
    statsPanel.begin();
    updateDebugPanel(playerMovement, camera);

    // Test animations, these should be made generic, like a list of everything that needs animating and each item documenting how it should be animated.
    const plainCube = scene.getObjectByName('plain-cube');
    plainCube.rotation.x += 0.02;
    plainCube.rotation.y += 0.02;
    const wireframeCube = scene.getObjectByName('wireframe-cube');
    wireframeCube.rotation.x += 0.01;
    wireframeCube.rotation.y += 0.01;

    playerMovement.update();

    // Render everyting.
    renderer.render(scene, camera);

    // Only code between .begin and .end is measured by statsPanel.
    // This block is therefore last and followed only by requestAnimationFrame.
    statsPanel.end();

    // Last line of animation.
    requestAnimationFrame((timestamp) => animate(renderer, scene, camera, playerMovement, statsPanel));
  }

  return animate;
});

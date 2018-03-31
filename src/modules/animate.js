define(['update-debug-panel', 'zone'], (updateDebugPanel, Zone) => {
  // Animation that keeps getting called to render everything and all changes.
  const animate = (renderer, scene, camera, keyboardControls, statsPanel, currentZone) => {
    statsPanel.begin();
    updateDebugPanel(camera);

    // Test animations, these should be made generic, like a list of everything that needs animating and each item documenting how it should be animated.
    const plainCube = scene.getObjectByName('plain-cube');
    plainCube.rotation.x += 0.02;
    plainCube.rotation.y += 0.02;
    const wireframeCube = scene.getObjectByName('wireframe-cube');
    wireframeCube.rotation.x += 0.01;
    wireframeCube.rotation.y += 0.01;

    keyboardControls.playerMovement.update();
    keyboardControls.playerMovement.persist();

    // Check if the current position of the camera is on one or several edges for the current zone.
    const edges = currentZone.isOnEdge(camera.position.x, camera.position.z);
    const contiguousZones = currentZone.contiguousZones();
    if (edges.isOnNorthEdge) {
      // Check if the zone on the north edge is already created.
      const northEdgeZoneMeshes = scene.getObjectByName(contiguousZones.north.name);
      if (!northEdgeZoneMeshes) {
        const northEdgeZone = new Zone(contiguousZones.north.x, contiguousZones.north.z);
        scene.add(northEdgeZone.meshes);
      }
    }

    // Render everyting.
    renderer.render(scene, camera);

    // Only code between .begin and .end is measured by statsPanel.
    // This block is therefore last and followed only by requestAnimationFrame.
    statsPanel.end();

    // Last line of animation.
    requestAnimationFrame((timestamp) => animate(renderer, scene, camera, keyboardControls, statsPanel, currentZone));
  }

  return animate;
});

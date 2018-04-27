define(
  [
    'update-debug-panel', 'update-current-zone', 'load-contiguous-zones'
  ],
  (updateDebugPanel, updateCurrentZone, loadContiguousZones) => {
    // Animation that keeps getting called to render everything and all changes.
    const animate = (
      renderer, scene, camera, keyboardControls,
      statsPanel, currentZone, loadedZones, findMesh
    ) => {
      statsPanel.begin();
      updateDebugPanel(camera);

      // Keyboard controls make it possible to move around the game (subjective perspective).
      keyboardControls.playerMovement.update();
      keyboardControls.playerMovement.persist();

      // Update the currentZone.
      currentZone = updateCurrentZone(currentZone, scene, camera, loadedZones);

      // Check if the current position of the camera is on one
      // or several edges for the current zone.
      const edges = currentZone.isOnEdge(camera.position.x, camera.position.z);
      const contiguousZones = currentZone.contiguousZones();
      loadContiguousZones(scene, edges, contiguousZones, loadedZones);

      // Render everyting.
      renderer.render(scene, camera);

      // Only code between .begin and .end is measured by statsPanel.
      // This block is therefore last and followed only by requestAnimationFrame.
      statsPanel.end();

      // Last line of animation.
      requestAnimationFrame((timestamp) => animate(
        renderer, scene, camera, keyboardControls,
        statsPanel, currentZone, loadedZones, findMesh
      ));
    };

    return animate;
  }
);

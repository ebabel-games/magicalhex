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

    if (edges.isOnSouthEdge) {
      const southEdgeZoneMeshes = scene.getObjectByName(contiguousZones.south.name);
      if (!southEdgeZoneMeshes) {
        const southEdgeZone = new Zone(contiguousZones.south.x, contiguousZones.south.z);
        scene.add(southEdgeZone.meshes);
      }
    }

    if (edges.isOnEastEdge) {
      const eastEdgeZoneMeshes = scene.getObjectByName(contiguousZones.east.name);
      if (!eastEdgeZoneMeshes) {
        const eastEdgeZone = new Zone(contiguousZones.east.x, contiguousZones.east.z);
        scene.add(eastEdgeZone.meshes);
      }
    }

    if (edges.isOnWestEdge) {
      const westEdgeZoneMeshes = scene.getObjectByName(contiguousZones.west.name);
      if (!westEdgeZoneMeshes) {
        const westEdgeZone = new Zone(contiguousZones.west.x, contiguousZones.west.z);
        scene.add(westEdgeZone.meshes);
      }
    }

    if (edges.isOnNorthEdge && edges.isOnEastEdge) {
      const northEastEdgeZoneMeshes = scene.getObjectByName(contiguousZones.northEast.name);
      if (!northEastEdgeZoneMeshes) {
        const northEastEdgeZone = new Zone(contiguousZones.northEast.x, contiguousZones.northEast.z);
        scene.add(northEastEdgeZone.meshes);
      }
    }

    if (edges.isOnSouthEdge && edges.isOnEastEdge) {
      const southEastEdgeZoneMeshes = scene.getObjectByName(contiguousZones.southEast.name);
      if (!southEastEdgeZoneMeshes) {
        const southEastEdgeZone = new Zone(contiguousZones.southEast.x, contiguousZones.southEast.z);
        scene.add(southEastEdgeZone.meshes);
      }
    }

    if (edges.isOnSouthEdge && edges.isOnWestEdge) {
      const southWestEdgeZoneMeshes = scene.getObjectByName(contiguousZones.southWest.name);
      if (!southWestEdgeZoneMeshes) {
        const southWestEdgeZone = new Zone(contiguousZones.southWest.x, contiguousZones.southWest.z);
        scene.add(southWestEdgeZone.meshes);
      }
    }

    if (edges.isOnNorthEdge && edges.isOnWestEdge) {
      const northWestEdgeZoneMeshes = scene.getObjectByName(contiguousZones.northWest.name);
      if (!northWestEdgeZoneMeshes) {
        const northWestEdgeZone = new Zone(contiguousZones.northWest.x, contiguousZones.northWest.z);
        scene.add(northWestEdgeZone.meshes);
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

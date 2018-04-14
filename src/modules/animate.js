define(['update-debug-panel', 'zone', 'update-current-zone'], (updateDebugPanel, Zone, updateCurrentZone) => {
  // Animation that keeps getting called to render everything and all changes.
  const animate = (raycaster, renderer, scene, camera, keyboardControls, statsPanel, currentZone, loadedZones, findMesh) => {
    statsPanel.begin();
    updateDebugPanel(camera);

    // Check if the camera is getting too close to the ground and should adjust its y position in relation to the ground.
    if (currentZone && currentZone.meshes && currentZone.meshes.children && currentZone.meshes.children.length > 0) {
      const currentGround = currentZone.meshes.children.filter(mesh => mesh.name.indexOf('ground') !== -1);

      const vector = new THREE.Vector3(camera.position.x, camera.position.y - 2, camera.position.z);
      vector.normalize();
      const cast = new THREE.Raycaster(camera.position, vector);
      const intersect = cast.intersectObject(currentGround[0], true);

      document.getElementById('targetName').innerText =
        (intersect && intersect.length && intersect[0]) ? intersect[0].distance : '';

        for (let i = 0; i < intersect.length; i++) {
          intersect[i].object.material.color.set( 0xff0000 );      
        }
    }

    // Keyboard controls make it possible to move around the game (subjective perspective).
    keyboardControls.playerMovement.update();
    keyboardControls.playerMovement.persist();

    // Update the currentZone.
    currentZone = updateCurrentZone(currentZone, scene, camera, loadedZones);

    // Check if the current position of the camera is on one or several edges for the current zone.
    const edges = currentZone.isOnEdge(camera.position.x, camera.position.z);
    const contiguousZones = currentZone.contiguousZones();

    if (edges.isOnNorthEdge) {
      // Check if the zone on the north edge is already created.
      const northEdgeZoneMeshes = scene.getObjectByName(contiguousZones.north.name);
      if (!northEdgeZoneMeshes) {
        const northEdgeZone = new Zone(contiguousZones.north.x, contiguousZones.north.z, loadedZones, scene);
        loadedZones.push(northEdgeZone.name);
        scene.add(northEdgeZone.meshes);
      }
    }

    if (edges.isOnSouthEdge) {
      const southEdgeZoneMeshes = scene.getObjectByName(contiguousZones.south.name);
      if (!southEdgeZoneMeshes) {
        const southEdgeZone = new Zone(contiguousZones.south.x, contiguousZones.south.z, loadedZones, scene);
        loadedZones.push(southEdgeZone.name);
        scene.add(southEdgeZone.meshes);
      }
    }

    if (edges.isOnEastEdge) {
      const eastEdgeZoneMeshes = scene.getObjectByName(contiguousZones.east.name);
      if (!eastEdgeZoneMeshes) {
        const eastEdgeZone = new Zone(contiguousZones.east.x, contiguousZones.east.z, loadedZones, scene);
        loadedZones.push(eastEdgeZone.name);
        scene.add(eastEdgeZone.meshes);
      }
    }

    if (edges.isOnWestEdge) {
      const westEdgeZoneMeshes = scene.getObjectByName(contiguousZones.west.name);
      if (!westEdgeZoneMeshes) {
        const westEdgeZone = new Zone(contiguousZones.west.x, contiguousZones.west.z, loadedZones, scene);
        loadedZones.push(westEdgeZone.name);
        scene.add(westEdgeZone.meshes);
      }
    }

    if (edges.isOnNorthEdge && edges.isOnEastEdge) {
      const northEastEdgeZoneMeshes = scene.getObjectByName(contiguousZones.northEast.name);
      if (!northEastEdgeZoneMeshes) {
        const northEastEdgeZone = new Zone(contiguousZones.northEast.x, contiguousZones.northEast.z, loadedZones, scene);
        loadedZones.push(northEastEdgeZone.name);
        scene.add(northEastEdgeZone.meshes);
      }
    }

    if (edges.isOnSouthEdge && edges.isOnEastEdge) {
      const southEastEdgeZoneMeshes = scene.getObjectByName(contiguousZones.southEast.name);
      if (!southEastEdgeZoneMeshes) {
        const southEastEdgeZone = new Zone(contiguousZones.southEast.x, contiguousZones.southEast.z, loadedZones, scene);
        loadedZones.push(southEastEdgeZone.name);
        scene.add(southEastEdgeZone.meshes);
      }
    }

    if (edges.isOnSouthEdge && edges.isOnWestEdge) {
      const southWestEdgeZoneMeshes = scene.getObjectByName(contiguousZones.southWest.name);
      if (!southWestEdgeZoneMeshes) {
        const southWestEdgeZone = new Zone(contiguousZones.southWest.x, contiguousZones.southWest.z, loadedZones, scene);
        loadedZones.push(southWestEdgeZone.name);
        scene.add(southWestEdgeZone.meshes);
      }
    }

    if (edges.isOnNorthEdge && edges.isOnWestEdge) {
      const northWestEdgeZoneMeshes = scene.getObjectByName(contiguousZones.northWest.name);
      if (!northWestEdgeZoneMeshes) {
        const northWestEdgeZone = new Zone(contiguousZones.northWest.x, contiguousZones.northWest.z, loadedZones, scene);
        loadedZones.push(northWestEdgeZone.name);
        scene.add(northWestEdgeZone.meshes);
      }
    }

    // Render everyting.
    renderer.render(scene, camera);

    // Only code between .begin and .end is measured by statsPanel.
    // This block is therefore last and followed only by requestAnimationFrame.
    statsPanel.end();

    // Last line of animation.
    requestAnimationFrame((timestamp) => animate(raycaster, renderer, scene, camera, keyboardControls, statsPanel, currentZone, loadedZones, findMesh));
  }

  return animate;
});

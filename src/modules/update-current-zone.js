define(['constants', 'round', 'zone'], (C, round, Zone) => {
  const log = (name) => console.log(`[INFO] current zone: ${name}.`)

  const updateCurrentZone = (currentZone, scene, camera, loadedZones) => {
    if (!currentZone) {
      currentZone = new Zone(camera.position.x, camera.position.z, loadedZones, scene);
      loadedZones.push(currentZone.name); // This name is pushed because there was no current zone at all, so this is a brand new zone just created.

      if (scene && currentZone && currentZone.meshes) {
        scene.add(currentZone.meshes);
      }

      log(currentZone.name);
    }

    // Update which zone is the current zone if the player has moved into a zone.
    // Note: that zone should already have been pre loaded into the game, so it should not create its meshes again.
    if (currentZone.isOutsideZone(camera.position.x, camera.position.z)) {
     currentZone = new Zone(camera.position.x, camera.position.z, loadedZones, scene);
     log(currentZone.name);
    }

    return currentZone;
  }

  return updateCurrentZone;
});

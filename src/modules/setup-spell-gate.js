define(['constants', 'update-current-zone'], (C, updateCurrentZone) => {
  // Teleport the player to the x: 0, z: 0 co-ordinate.
  const setupSpellGate = (currentZone, scene, camera, loadedZones) => {
    document.addEventListener(C.EVENTS.CAST_SPELL_GATE, (e) => {
      camera.position.set(C.CAMERA.X, C.CAMERA.Y, C.CAMERA.Z);
      currentZone = updateCurrentZone(currentZone, scene, camera, loadedZones);
    }, false);
  }

  return setupSpellGate;
});

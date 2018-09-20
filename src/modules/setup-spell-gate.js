define(['constants', 'zone'], (C, Zone) => {
  // Teleport the player to the x: 0, z: 0 co-ordinate.
  const castGate = (e) => {
    // Check if the target zone to gate to is already in the game. If not, load it first.
    if (!e.detail.scene.getObjectByName('zone0:0')) {
      const zoneToGateTo = new Zone(C.CAMERA.X, C.CAMERA.Y, e.detail.loadedZones, e.detail.scene);
      e.detail.scene.add(zoneToGateTo.meshes);
    }

    // Move the player camera to the default origin location.
    e.detail.camera.position.set(C.CAMERA.X, C.CAMERA.Y, C.CAMERA.Z);

    e.preventDefault();
  };

  // Handle pressing the gate spell key: 7.
  const setupSpellGate = () => {
    document.addEventListener(C.EVENTS.CAST_SPELL_GATE, castGate, false);
  };

  return setupSpellGate;
});

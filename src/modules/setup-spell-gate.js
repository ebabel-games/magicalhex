define(['constants'], (C) => {
  // Teleport the player to the x: 0, z: 0 co-ordinate.
  const setupSpellGate = (camera) => {
    document.addEventListener(C.EVENTS.CAST_SPELL_GATE, (e) => {
      camera.position.set(C.CAMERA.X, C.CAMERA.Y, C.CAMERA.Z);
    }, false);
  }

  return setupSpellGate;
});

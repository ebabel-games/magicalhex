define(['constants'], (C) => {
  // Teleport the player to the x: 0, z: 0 co-ordinate.
  const castGate = (e) => {
    e.detail.camera.position.set(C.CAMERA.X, C.CAMERA.Y, C.CAMERA.Z);
  };

  // Handle pressing the gate spell key: 7.
  const setupSpellGate = () => {
    document.addEventListener(C.EVENTS.CAST_SPELL_GATE, castGate, false);
  }

  return setupSpellGate;
});

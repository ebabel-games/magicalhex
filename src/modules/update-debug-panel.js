define(['constants', 'round'], (C, round) => {
  const updateDebugPanel = (playerMovement, camera) => {
    document.getElementById(C.UI.DEBUG_X).textContent = round(camera.position.x, 1);
    document.getElementById(C.UI.DEBUG_Z).textContent = round(camera.position.z, 1);
  }

  return updateDebugPanel;
});

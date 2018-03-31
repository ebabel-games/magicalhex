define(['constants', 'round'], (C, round) => {
  const updateDebugPanel = (playerMovement, camera) => {
    document.getElementById(C.UI.DEBUG_X).textContent = round(camera.position.x, C.POSITION_DISPLAY_DECIMALS);
    document.getElementById(C.UI.DEBUG_Z).textContent = round(camera.position.z, C.POSITION_DISPLAY_DECIMALS);
  }

  return updateDebugPanel;
});

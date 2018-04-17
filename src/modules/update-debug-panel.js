define(['constants', 'round'], (C, round) => {
  const updateDebugPanel = (camera) => {
    document.getElementById(C.UI.DEBUG_X).textContent = round(camera.position.x);
    document.getElementById(C.UI.DEBUG_Z).textContent = round(camera.position.z);
  };

  return updateDebugPanel;
});

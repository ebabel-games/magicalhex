define([], () => {
  const updateDebugPanel = (playerMovement, camera) => {
    document.getElementById('debugX').textContent = Math.round(camera.position.x * 10) / 10;
    document.getElementById('debugZ').textContent = Math.round(camera.position.z * 10) / 10;
  }

  return updateDebugPanel;
});

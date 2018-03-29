define([], () => {
  // Set window.debugMode to switch from normal gameplay to super powered.
  console.log('Set window.debugMode to true to enable the debug mode.');

  const debug = (playerMovement, camera) => {
    if (window.debugMode) {
      playerMovement.forwardSpeed = 1;
      playerMovement.backwardSpeed = 1;
      document.getElementById('debugX').textContent = Math.round(camera.position.x * 10) / 10;
      document.getElementById('debugZ').textContent = Math.round(camera.position.z * 10) / 10;
      document.getElementById('debug-window').style.display = 'block';
    }
  }

  return debug;
});

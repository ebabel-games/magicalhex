define([], () => {
  // Set window.debugMode to switch from normal gameplay to super powered.
  console.log('Set window.debugMode to true to enable the debug mode.');
  console.log('Press the ESC key to toggle the performance stats panel (debugMode needs to be on).');

  const debug = (playerMovement, camera) => {
    playerMovement.forwardSpeed = 1;
    playerMovement.backwardSpeed = 1;
    document.getElementById('debugX').textContent = Math.round(camera.position.x * 10) / 10;
    document.getElementById('debugZ').textContent = Math.round(camera.position.z * 10) / 10;
    document.getElementById('debug-window').style.display = 'block';
  }

  return debug;
});

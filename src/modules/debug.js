define([], () => {
  // Set window.debug to switch from normal gameplay to super powered.
  const debug = (playerMovement, camera) => {
    if (window.debug) {
      playerMovement.forwardSpeed = 1;
      playerMovement.backwardSpeed = 1;
      document.getElementById('debugX').textContent = Math.round(camera.position.x * 10) / 10;
      document.getElementById('debugZ').textContent = Math.round(camera.position.z * 10) / 10;
      document.getElementById('debug-window').style.display = 'block';
    }
  }

  return debug;
});

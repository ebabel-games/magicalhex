define([], () => {
  const forwardSpeed = 0.5;
  const backwardSpeed = Math.round(forwardSpeed / 3 * 100) / 100;
  const turnSpeed = Math.round((4 * Math.PI / 180) * 100) / 100;
  const key = {
    up: 38,
    w: 87,
    down: 40,
    s: 83,
    left: 37,
    a: 65,
    right: 39,
    d: 68,
  };

  const onKeyDown = (e, camera) => {
    switch (e.keyCode) {
      case key.up:
      case key.w:
        camera.translateZ(- forwardSpeed);
        break;
      case key.down:
      case key.s:
        camera.translateZ(backwardSpeed);
        break;
      case key.left:
      case key.a:
        camera.rotation.y += turnSpeed;
        break;
      case key.right:
      case key.d:
        camera.rotation.y -= turnSpeed;
        break;
    }
  };

  // Control the movement of the main player via keyboard keys.
  const playerMovement = (camera) => {
    window.document.addEventListener('keydown', (e) => {
      onKeyDown(e, camera);
    }, false);
  };

  return playerMovement;
});

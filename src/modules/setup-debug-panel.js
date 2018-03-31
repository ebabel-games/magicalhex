define(['constants'], (C) => {
  const setupDebugPanel = (playerMovement) => {
    const toggleDebug = (e) => {
      playerMovement.forwardSpeed = 2;
      playerMovement.backwardSpeed = 2;
      document.getElementById('debug-panel').style.display = 'block';
    };

    document.addEventListener(C.EVENTS.TOGGLE_DEBUG, toggleDebug);

    return this;
  };

  return setupDebugPanel;
});

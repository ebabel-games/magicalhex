define(['constants'], (C) => {
  const setupDebugPanel = (playerMovement) => {
    const toggleDebug = (e) => {
      playerMovement.forwardSpeed = C.DEBUG_FORWARD_SPEED;
      playerMovement.backwardSpeed = C.DEBUG_BACKWARD_SPEED;
      document.getElementById(C.UI.DEBUG_PANEL).style.display = 'block';
    };

    document.addEventListener(C.EVENTS.TOGGLE_DEBUG, toggleDebug);

    return this;
  };

  return setupDebugPanel;
});

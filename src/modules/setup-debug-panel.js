define(['constants'], (C) => {
  const setupDebugPanel = (keyboardControls) => {
    const toggleDebug = (e) => {
      keyboardControls.playerMovement.forwardSpeed = C.DEBUG_FORWARD_SPEED;
      keyboardControls.playerMovement.backwardSpeed = C.DEBUG_BACKWARD_SPEED;
      document.getElementById(C.UI.DEBUG_PANEL).style.display = 'block';
    };

    document.addEventListener(C.EVENTS.TOGGLE_DEBUG, toggleDebug);

    return this;
  };

  return setupDebugPanel;
});

define(['constants'], (C) => {
  const setupDebugPanel = (keyboardControls) => {
    const toggleDebug = (e) => {
      const debugPanel = document.getElementById(C.UI.DEBUG_PANEL);

      if (debugPanel.style.display === '' || debugPanel.style.display === 'none') {
        keyboardControls.playerMovement.forwardSpeed = C.DEBUG_FORWARD_SPEED;
        keyboardControls.playerMovement.backwardSpeed = C.DEBUG_BACKWARD_SPEED;
        debugPanel.style.display = 'block';
      } else {
        keyboardControls.playerMovement.forwardSpeed = C.PLAYER_FORWARD_SPEED;
        keyboardControls.playerMovement.backwardSpeed = C.PLAYER_BACKWARD_SPEED;
        debugPanel.style.display = 'none';
      }      
    };

    document.addEventListener(C.EVENTS.TOGGLE_DEBUG, toggleDebug);

    return this;
  };

  return setupDebugPanel;
});

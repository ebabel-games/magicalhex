define(['constants'], (C) => {
  const versionResetData = () => {
    // Latest version that has been downloaded.
    const latestVersion = C.VERSION.LATEST;

    // Version stored locally on the client.
    const localVersion = parseInt(localStorage.version, 10) || C.VERSION.NONE;

    // Decide if the client local data should be reset.
    if (localVersion !== latestVersion) {
      // Data to persist despite the reset.
      const data = {
        rotation: localStorage.CAMERA_ROTATION_Y,
        x: localStorage.CAMERA_X,
        y: localStorage.CAMERA_Y,
        z: localStorage.CAMERA_Z
      };

      // Delete all local client data.
      localStorage.clear();

      // Restore some of the old data.
      localStorage.CAMERA_ROTATION_Y = data.rotation;
      localStorage.CAMERA_X = data.x;
      localStorage.CAMERA_Y = data.y;
      localStorage.CAMERA_Z = data.z;

      // Set the latest version locally.
      localStorage.version = C.VERSION.LATEST;

      return true;
    }

    return false;
  };

  return versionResetData;
});

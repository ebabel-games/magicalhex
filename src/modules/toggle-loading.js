define(['constants'], (C) => {
  // Toggle loading screen off once the game is ready.
  const toggleLoading = () => {
    document.getElementById(C.UI.PLAY).addEventListener('click', (e) => {
      document.getElementById(C.UI.LOADING).style.display = 'none';
      document.getElementById(C.UI.GAME).style.display = 'block';

      e.preventDefault();
    });

    THREE.DefaultLoadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`[INFO] loading file ${url}.\n[INFO] loaded ${itemsLoaded} of ${itemsTotal} files.`);
    };

    THREE.DefaultLoadingManager.onLoad = () => {
      document.getElementById(C.UI.PLAY).disabled = false;
      document.getElementById(C.UI.PLAY).innerText = 'Play';
    };

    THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`[INFO] loading file ${url}.\n[INFO] loaded ${itemsLoaded} of ${itemsTotal} files.`);
    };

    THREE.DefaultLoadingManager.onError = (url) => {
      console.error(`[ERROR] loading ${url} failed.`);
    };
  };

  return toggleLoading;
});

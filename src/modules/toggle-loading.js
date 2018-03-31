define(['constants'], (C) => {
  // Toggle loading screen off once the game is ready.
  const toggleLoading = () => {
    document.getElementById(C.UI.PLAY).addEventListener('click', (e) => {
      document.getElementById(C.UI.LOADING).style.display = 'none';
      document.getElementById(C.UI.GAME).style.display = 'block';
    });

    THREE.DefaultLoadingManager.onStart = (url, itemsLoaded, itemsTotal ) => {
      console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    
    THREE.DefaultLoadingManager.onLoad = () => {
      document.getElementById(C.UI.PLAY).disabled = false;
      document.getElementById(C.UI.PLAY).innerText = 'Play';
    };
    
    THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
    };
    
    THREE.DefaultLoadingManager.onError = (url) => {
      console.log( 'There was an error loading ' + url );
    };
  };

  return toggleLoading;
});

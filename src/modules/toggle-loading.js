define([], () => {
  // Toggle loading screen off once the game is ready.
  const toggleLoading = () => {
    document.getElementById('play').addEventListener('click', (e) => {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('game').style.display = 'block';
    });

    THREE.DefaultLoadingManager.onStart = (url, itemsLoaded, itemsTotal ) => {
      console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    
    THREE.DefaultLoadingManager.onLoad = () => {
      document.getElementById('play').disabled = false;
      document.getElementById('play').innerText = 'Play';
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

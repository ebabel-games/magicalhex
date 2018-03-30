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
      document.getElementById('please-wait').style.visibility = 'hidden';
      document.getElementById('play').style.display = 'block';
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

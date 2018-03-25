var initScene = function initScene (input) {
  const scene = input && input.scene;
  const renderer = input && input.renderer;
  const lights = input && input.lights;
  const camera = input && input.camera;

  if (!scene || !renderer || !lights || !camera || 
      !camera.type || !camera.aspectRatio || !camera.nearPlane || !camera.farPlane) {
      throw new Error(error.input.required);
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('game').appendChild(renderer.domElement);

  lights.map(function addLight (toAdd) {
      if (toAdd.position) {
          toAdd.light.position.set(toAdd.position.x, toAdd.position.y, toAdd.position.z);
      }
      scene.add(toAdd.light);
  });

  const output = new THREE[camera.type](
      camera.angle, 
      camera.aspectRatio, 
      camera.nearPlane, 
      camera.farPlane
  );

  output.position.set(
      camera.position && camera.position.x || 0,
      camera.position && camera.position.y || 0,
      camera.position && camera.position.z || 2
  );
  
  scene.add(output);

  return output;
};

(() => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x9db3b5, 0.005);

  const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  const lights = [
      { light:  new THREE.HemisphereLight(0xffffcc, 0x080820, 0.2) },
      { light: new THREE.DirectionalLight(0xccff20, 0.2), position: { x: 10, y: 10, z: 10 } },
      { light: new THREE.DirectionalLight(0xccff20, 0.2), position: { x: -10, y: 10, z: -10 } }
  ];
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();

  const character = {
    position: { x: 0, y: 6, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };

  const camera = initScene({
      scene: scene,
      renderer: renderer,
      lights: lights,
      camera: {
          type: 'PerspectiveCamera',
          angle: 45,
          aspectRatio: window.innerWidth / window.innerHeight,
          nearPlane: 1,
          farPlane: 300,
          position: { x: character.position.x, y: character.position.y, z: character.position.z },
          rotation: { x: character.rotation.x, y: character.rotation.y, z: character.rotation.z }
      }
  });

  let currentTarget = null;

  const keyCodes = {
    '1': 49,    // Cast first memorized spell.
    'esc': 27   // Escape: clear current target.
  };

  // Listen for a change of target.
  document.addEventListener('change-target', function onChangeTarget (e) {
    currentTarget = e.detail.currentTarget;
  }, true);

  // Listen for a key.
  document.addEventListener('keydown', function onKeyDown (e) {
    // Clear the current target.
    if (e.keyCode === keyCodes['esc']) {
        document.dispatchEvent(
            new CustomEvent('change-target', 
            { 
                'detail': {
                    'targetName': 'no target',
                    'life': null,
                    'currentTarget': null
                }
            })
        );
    }

    // The key [1] has been pressed, which fires damage on the current target.
    if (currentTarget && e.keyCode === keyCodes['1']) {

        currentTarget.takeDamage({
            model: currentTarget,
            damage: 1
        });

        document.dispatchEvent(
            new CustomEvent('change-target', 
            { 
                'detail': {
                    'targetName': currentTarget.userData.targetName,
                    'life': currentTarget.userData.life,
                    'currentTarget': currentTarget
                }
            })
        );
    }
  });

  // Prevent selection on the page
  document.onselectstart = function onSelectStart() { return false; }

  return this;
})();

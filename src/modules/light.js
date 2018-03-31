define(['constants'], (C) => {
  class Light {
    constructor(color = C.SUNLIGHT.COLOR, intensity = C.SUNLIGHT.INTENSITY, x = C.SUNLIGHT.X, y = C.SUNLIGHT.Y, z = C.SUNLIGHT.Z, name = C.SUNLIGHT.NAME) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      light.name = name;

      // Shadows setup.
      light.castShadow = true;
      light.shadow.mapSize.width = 2048;  // Resolution, crispiness of the shadows. High values are more crisp but cost more computation.
      light.shadow.mapSize.height = 2048;
      light.shadow.camera.far = 2500;
      light.shadow.camera.left = -1000;
      light.shadow.camera.right = 1000;
      light.shadow.camera.top = 1000;
      light.shadow.camera.bottom = -1000;
      
      return light;
    }
  }

  return Light;
});

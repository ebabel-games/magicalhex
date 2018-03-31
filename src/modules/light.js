define(['constants'], (C) => {
  class Light {
    constructor(color = C.SUNLIGHT.COLOR, intensity = C.SUNLIGHT.INTENSITY, x = C.SUNLIGHT.X, y = C.SUNLIGHT.Y, z = C.SUNLIGHT.Z, name = C.SUNLIGHT.NAME) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      light.name = name;
      light.castShadow = true;
      
      return light;
    }
  }

  return Light;
});

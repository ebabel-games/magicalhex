define(['constants'], (C) => {
  class Light {
    constructor(color, intensity, name) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.name = name;
      light.castShadow = true;
      
      return light;
    }
  }

  return Light;
});

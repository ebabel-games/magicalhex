define([], () => {
  class Light {
    constructor(color = 0xffff00, intensity = 0.75, x = 0, y = 1, z = 0, name = 'sunlight') {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      light.name = name;

      return light;
    }
  }

  return Light;
});

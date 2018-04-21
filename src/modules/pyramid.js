define([], () => {
  const texture = new THREE.TextureLoader().load('textures/pyramid.png');

  const loader = new THREE.JSONLoader();

  class Pyramid {
    constructor(input = {}) {
      const name = input.name || 'pyramid';
      const x = input.x || 0;
      const y = input.y || 0.1;
      const z = input.z || 0;
      const scene = input.scene;

      // load a resource
      loader.load(
        'models/pyramid.json',
        (geometry) => {
          const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide, alphaTest: 0.3 })
          );
          mesh.name = name;
          mesh.position.set(x, y, z);
          scene.add(mesh);
        },
        (xhr) => {
          console.log(`[INFO] ${name} model: ${(xhr.loaded / (xhr.total * 100))}% loaded.`);
        },
        (err) => {
          console.log(`An error happened ${err}`);
        }
      );
    }
  }

  return Pyramid;
});

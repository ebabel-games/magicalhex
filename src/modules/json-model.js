define(['constants'], (C) => {
  const loader = new THREE.JSONLoader();

  class JsonModel {
    constructor(input = {}) {
      const name = input.name || '';
      const x = input.x || C.JSON_MODEL.X;
      const y = input.y || C.JSON_MODEL.Y;
      const z = input.z || C.JSON_MODEL.Z;
      const scene = input.scene;
      const alphaTest = input.alphaTest || C.JSON_MODEL.ALPHA_TEST;
      const side = input.side || C.JSON_MODEL.SIDE;
      const texture = input.texture || null;
      const model = input.model || null;

      const map = (texture) ? new THREE.TextureLoader().load(`textures/${texture}`) : null;
      const material = (map) ? new THREE.MeshLambertMaterial({ map, side, alphaTest })
        : new THREE.LineBasicMaterial({
          color: C.GRID.COLOR, opacity: C.GRID.OPACITY, side, alphaTest
        });

      loader.load(
        `models/${model}.json`,
        (geometry) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = name;
          mesh.position.set(x, y, z);
          scene.add(mesh);
        },
        (xhr) => {
          console.log(`[INFO] ${name} model: ${(xhr.loaded / (xhr.total * 100))}% loaded.`);
        },
        (err) => {
          console.log(`[ERROR] An error happened ${err}`);
        }
      );
    }
  }

  return JsonModel;
});

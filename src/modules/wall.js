define(['constants'], (C) => {
  const texture = new THREE.TextureLoader().load('textures/rock.jpg');

  class Wall {
    constructor(input) {
      const name = input.name;
      const x = input.x;
      const y = input.y || C.WALL.Y;
      const z = input.z;

      const w = input.w || C.WALL.WIDTH;  // On x axis.
      const h = input.h || C.WALL.HEIGHT; // On y axis.
      const d = input.d || C.WALL.DEPTH;  // On z axis.

      const mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(w, h, d),
        new THREE.MeshLambertMaterial({map: texture})
      );
      mesh.name = name;
      mesh.position.set(x, y, z);

      mesh.persist = {
        n: name,
        c: 'wall',
        i: {name, x, y, z, w, h, d},
      };
  
      return mesh;
    }
  };

  return Wall;
});

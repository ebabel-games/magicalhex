define(['constants', 'rotate-to-horizontal'], (C, rotateToHorizontal) => {
  // Note: these constants never change, regardless of the ground instance.
  const width = C.ZONE_SIZE;
  const height = C.ZONE_SIZE;

  // Flat plane mesh that forms the ground in each zone.
  class Ground {
    constructor(name) {
      if (!name) {
        throw new Error(C.ERROR.MISSING_PARAMETERS);
      }

      const texture = new THREE.TextureLoader().load('textures/ground.jpg');
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(width / 256, height / 256);

      const mesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(width, height),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
      );
      mesh.name = name;
      rotateToHorizontal(mesh);

      // Properties used to persist this mesh and recreate it later.
      mesh.persist = {
        n: name,      // mesh name.
        c: 'Ground',  // class to instantiate.
        p: [0, 0, 0],  // x, y, z position coordinates.
      };
  
      return mesh;
    }
  };

  return Ground;
});

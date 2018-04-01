define(['constants'], (C) => {
  // Note: these constants never change, regardless of the ground instance.
  const width = C.ZONE_SIZE;
  const height = C.ZONE_SIZE;

  const texture = new THREE.TextureLoader().load('textures/ground.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(width / 256, height / 256);

  // Flat plane mesh that forms the ground in each zone.
  class Ground {
    constructor(name) {
      if (!name) {
        throw new Error('Missing ground name, it cannot be built without a name.');
      }

      const mesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(width, height),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
      );
      mesh.rotation.set(-90 * Math.PI / 180, 0, 0);
      mesh.receiveShadow = true;
      mesh.name = name;
  
      return mesh;
    }
  };

  return Ground;
});

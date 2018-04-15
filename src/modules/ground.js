define(['constants', 'round', 'rotate-to-horizontal'], (C, round, rotateToHorizontal) => {
  // Note: these constants never change, regardless of the ground instance.
  const width = C.ZONE_SIZE;
  const height = C.ZONE_SIZE;

  // The texture is only loaded once for this class, regardless of the number of instances.
  const texture = new THREE.TextureLoader().load('textures/ground.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(width / 256, height / 256);

  // Flat plane mesh that forms the ground in each zone.
  class Ground {
    constructor(input) {
      const name = input.name;
      const x = input.x || C.GROUND.X;
      const y = input.y || C.GROUND.Y;
      const z = input.z || C.GROUND.Z;
      const d = input.d || C.GROUND.DIVISION_SIZE;
      const n = input.n || C.GROUND.NOISE;
      const r = input.r || C.GROUND.ROUGHNESS;

      const geometry = new THREE.PlaneGeometry(width, height, d, d);

      const inRange = (i) => (i > -400 && i < -50) || (i < 400 && i > 50);

      // Add noise to the ground.
      if (r) {
        geometry.vertices = geometry.vertices.map(v => {
          // The edges and the center of the zone are always flat.
          if (inRange(v.x) && inRange(v.y) && Math.random() < r) {
            // Vertices near the center can be higher.
            v.z = round(Math.random() * n, 2);
          }
  
          return v;
        });
      }

      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
      );
      rotateToHorizontal(mesh);

      mesh.name = name;
      mesh.position.set(x, y, z);

      // Properties used to persist this mesh and recreate it later.
      mesh.persist = {
        n: name,
        c: 'ground',
        i: {name, x, y, z, d, n},
      };

      return mesh;
    }
  };

  return Ground;
});

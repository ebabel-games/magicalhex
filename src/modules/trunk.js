define(['constants'], (C) => {
  const texture = new THREE.TextureLoader().load('textures/wood.jpg');

  // Stub of a tree trunk that has been cut.
  class Trunk {
    constructor(input) {
      const name = input.name;
      const x = input.x;  // Position coordinates.
      const y = input.y;
      const z = input.z;
      const t = input.t || C.TRUNK.RADIUS_TOP;
      const b = input.b || C.TRUNK.RADIUS_BOTTOM;
      const h = input.h || C.TRUNK.HEIGHT;
      const r = input.r || C.TRUNK.RADIAL_SEGMENTS;
      const s = input.s || C.TRUNK.HEIGHT_SEGMENTS;

      const mesh = new THREE.Mesh(
        new THREE.CylinderBufferGeometry(t, b, h, r, s),
        new THREE.MeshLambertMaterial({map: texture})
      );
      mesh.name = name;
      mesh.position.set(x, y, z);

      // Properties used to persist this mesh and recreate it later.
      mesh.persist = {
        n: name,
        c: 'Trunk',
        i: {name, x, y, z, t, b, h, r, s},
      };
  
      return mesh;
    }
  };

  return Trunk;
});

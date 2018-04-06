define(['constants', 'trunk', 'degrees-to-radians'], (C, Trunk, degreesToRadians) => {
  const foliageTexture = new THREE.TextureLoader().load('textures/foliage.png');
  const trunkTexture = new THREE.TextureLoader().load('textures/wood.jpg');

  // todo: inherit from this tree (if possible) to make the WillowTree class.
  class BaseTree {
    constructor(input) {
      const name = input.name;
      const x = input.x;
      const y = input.y || C.BASE_TREE.Y;
      const z = input.z;
      const v = input.v || C.BASE_TREE.V;
      const h = input.h || C.BASE_TREE.HEIGHT;

      const trunk = new Trunk({name: `trunk-${name}`, x: 0, y: -((h - 2) / 2), z: 0, v, h: h - 2});

      const foliagePlanes = [
        new THREE.Mesh(
          new THREE.PlaneBufferGeometry(6, 3),
          new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5})
        ),
        new THREE.Mesh(
          new THREE.PlaneBufferGeometry(6, 3), 
          new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5})
        ),
      ];

      foliagePlanes[0].name = `foliage0-${name}`;

      // Rotate vertically by 90 degrees.
      foliagePlanes[1].name = `foliage1-${name}`;
      foliagePlanes[1].rotation.y = degreesToRadians(90);

      const mesh = new THREE.Group();
      mesh.add(trunk);
      mesh.add(foliagePlanes[0]);
      mesh.add(foliagePlanes[1]);
      
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.rotation.y = v;

      // Properties used to persist this mesh and recreate it later.
      mesh.persist = {
        n: name,
        c: 'BaseTree',
        i: {name, x, y, z},
      };
  
      return mesh;
    }
  };

  return BaseTree;
});

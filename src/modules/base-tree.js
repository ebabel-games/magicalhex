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

      const foliages = [
        new THREE.Mesh(
          new THREE.PlaneBufferGeometry(12, 6),
          new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5})
        ),
        new THREE.Mesh(
          new THREE.PlaneBufferGeometry(12, 6), 
          new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5})
        ),
      ].map((foliage, index) => {
        foliage.name = `foliage${index}-${name}`;
        foliage.position.y = 1.5;

        return foliage;
      });

      // Rotate vertically by 90 degrees.
      foliages[1].rotation.y = degreesToRadians(90);

      const mesh = new THREE.Group();
      mesh.add(trunk);
      mesh.add(foliages[0]);
      mesh.add(foliages[1]);
      
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.rotation.y = v;

      mesh.persist = {
        n: name,
        c: 'base-tree',
        i: {name, x, y, z},
      };
  
      return mesh;
    }
  };

  return BaseTree;
});

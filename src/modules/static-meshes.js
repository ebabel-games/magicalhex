define(['cube'], (Cube) => {
  // Generate multiple static meshes and bind them to a single parent,
  // so they are more performant and can be added to the scene in one go.
  class StaticMeshes {
    constructor() {
      const meshes = new THREE.Object3D();

      // Plain cube.
      const plainCube = new Cube();
      plainCube.name = 'plain-cube';
      plainCube.position.y = 2;
      meshes.add(plainCube);

      // Wireframe cube.
      const wireframeCube = new Cube(2, true, 0xffcc00);
      wireframeCube.name = 'wireframe-cube';
      wireframeCube.position.y = 2;
      meshes.add(wireframeCube);

      // Static cubes.
      const staticCubes = new Array(2000).fill({}).map(input => {
        const staticCube = new Cube(6, false, 0x03300);

        staticCube.position.x = Math.round(Math.random() * 1000 - 500);
        staticCube.position.y = 3;
        staticCube.position.z = Math.round(Math.random() * 1000 - 500);

        meshes.add(staticCube);

        return staticCube;
      });

      return meshes;
    }
  }

  return StaticMeshes;
});

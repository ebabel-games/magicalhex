define(['cube'], (cube) => {
  // Generate multiple static meshes and bind them to a single parent,
  // so they are more performant and can be added to the scene in one go.
  class StaticMeshes {
    constructor() {
      const meshes = new THREE.Object3D();

      // All the possible positions where meshes can be placed.
      // Ex: this.matrix[0][2] is position x = 0 and z = 2
      // this.matrix = new Array(100).fill(new Array(100).fill({}));
      // todo: work out a good, intuitive way to make a matrix.
      // see answer on https://softwareengineering.stackexchange.com/questions/212808/treating-a-1d-data-structure-as-2d-grid

      // Plain cube.
      const plainCube = cube();
      plainCube.name = 'plain-cube';
      plainCube.position.y = 2;
      meshes.add(plainCube);

      // Wireframe cube.
      const wireframeCube = cube(2, true, 0xffcc00);
      wireframeCube.name = 'wireframe-cube';
      wireframeCube.position.y = 2;
      meshes.add(wireframeCube);

      // Static cubes.
      const staticCubes = new Array(2000).fill({}).map(input => {
        const staticCube = cube(1, false, 0x7b3612);

        staticCube.position.x = Math.round(Math.random() * 1000 - 500);
        staticCube.position.y = Math.round((Math.random() * 0.75 + 0.5) * 10) / 10;
        staticCube.position.z = Math.round(Math.random() * 1000 - 500);

        meshes.add(staticCube);

        return staticCube;
      });

      return meshes;
    }
  }

  return StaticMeshes;
});

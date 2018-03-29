define(['ground', 'static-meshes'], (Ground, StaticMeshes) => {
  class Zone {
    constructor(x, z) {
      // Main container for all static meshes that make up a zone.
      this.meshes = new THREE.Object3D();

      this.x = Math.round(x / 1000);
      this.z = Math.round(z / 1000);

      // Near the zone edges, the adjacent zones should be loaded.
      this.edges = {
        north: this.z * 500 - 400,
        south: this.z * 500 + 400,
        east: this.x * 500 + 400,
        west: this.x * 500 - 400,
      };

      // Identify a zone name from the camera x and z position.
      this.meshes.name = `zone${this.x}:${this.z}`;

      // Add the ground.
      this.meshes.add(new Ground(`ground-${this.meshes.name}`));

      // Add the test static meshes.
      // todo: delete these static meshes and use a procedural routine to decide what to place in the zone.
      this.meshes.add(new StaticMeshes());
      
      // Last step.
      return this;
    }
  }

  return Zone;
});

// All the possible positions where meshes can be placed.
// Ex: this.matrix[0][2] is position x = 0 and z = 2
// this.matrix = new Array(100).fill(new Array(100).fill({}));
// todo: work out a good, intuitive way to make a matrix.
// see answer on https://softwareengineering.stackexchange.com/questions/212808/treating-a-1d-data-structure-as-2d-grid

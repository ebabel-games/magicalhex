define(['ground', 'static-meshes', 'round'], (Ground, StaticMeshes, round) => {
  class Zone {
    constructor(x, z) {
      // Origin at scale 1000 of this zone based on input from camera position.
      this.x = parseInt(round(x / 1000));
      this.z = parseInt(round(z / 1000));

      // Main container for all static meshes that make up a zone.
      this.meshes = new THREE.Object3D();

      // Place the parent at the correct co-ordinates based on camera current position.
      this.meshes.position.set(this.x * 1000, 0, this.z * 1000)

      // Near the zone edges, the adjacent zones should be loaded.
      this.edges = {
        north: this.z * 1000 - 400,
        south: this.z * 1000 + 400,
        east: this.x * 1000 + 400,
        west: this.x * 1000 - 400,
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

    // For a given x and z, from the camera current position for example, return if that position is on one or several edges for this zone.
    isOnEdge(x, z) {
      return {
        isOnNorthEdge: z < this.edges.north,
        isOnSouthEdge: z > this.edges.south,
        isOnEastEdge: x > this.edges.east,
        isOnWestEdge: x < this.edges.west,
      };
    }

    // 8 zones touching this one.
    contiguousZones() {
      return {
        north: { x: this.x * 1000, z: (this.z - 1) * 1000, name: `zone${this.x}:${this.z - 1}` },
        south: { x: this.x * 1000, z: (this.z + 1) * 1000, name: `zone${this.x}:${this.z + 1}` },
        east: { x: (this.x + 1) * 1000, z: this.z * 1000, name: `zone${this.x + 1}:${this.z}` },
        west: { x: (this.x - 1) * 1000, z: this.z * 1000, name: `zone${this.x - 1}:${this.z}` },
        northEast: { x: (this.x + 1) * 1000, z: (this.z - 1) * 1000, name: `zone${this.x + 1}:${this.z - 1}` },
        southEast: { x: (this.x + 1) * 1000, z: (this.z + 1) * 1000, name: `zone${this.x + 1}:${this.z + 1}` },
        southWest: { x: (this.x - 1) * 1000, z: (this.z + 1) * 1000, name: `zone${this.x - 1}:${this.z + 1}` },
        northWest: { x: (this.x - 1) * 1000, z: (this.z - 1) * 1000, name: `zone${this.x - 1}:${this.z - 1}` },
      };
    }
  }

  return Zone;
});

// All the possible positions where meshes can be placed.
// Ex: this.matrix[0][2] is position x = 0 and z = 2
// this.matrix = new Array(100).fill(new Array(100).fill({}));
// todo: work out a good, intuitive way to make a matrix.
// see answer on https://softwareengineering.stackexchange.com/questions/212808/treating-a-1d-data-structure-as-2d-grid

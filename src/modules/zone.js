define(['constants', 'ground', 'static-meshes', 'round', 'light'], (C, Ground, StaticMeshes, round, Light) => {
  class Zone {
    constructor(x, z) {
      // Origin at scale C.ZONE_SIZE of this zone based on input from camera position.
      this.x = parseInt(round(x / C.ZONE_SIZE));
      this.z = parseInt(round(z / C.ZONE_SIZE));
      this.name = `zone${this.x}:${this.z}`;

      // Main container for all static meshes that make up a zone.
      this.meshes = new THREE.Object3D();

      // Place the parent at the correct co-ordinates based on camera current position.
      this.meshes.position.set(this.x * C.ZONE_SIZE, 0, this.z * C.ZONE_SIZE)

      // Near the zone edges, the adjacent zones should be loaded.
      const zoneSizeBuffer = (C.ZONE_SIZE / 2) - 100;
      this.edges = {
        north: this.z * C.ZONE_SIZE - zoneSizeBuffer,
        south: this.z * C.ZONE_SIZE + zoneSizeBuffer,
        east: this.x * C.ZONE_SIZE + zoneSizeBuffer,
        west: this.x * C.ZONE_SIZE - zoneSizeBuffer,
      };

      // Identify a zone name from the camera x and z position.
      this.meshes.name = this.name;

      // Add the ground.
      const ground = new Ground(`ground-${this.meshes.name}`);
      this.meshes.add(ground);
      ground.position.set(0, 0, 0); // Position of the ground is relative to its own zone.

      // Add the test static meshes.
      // todo: delete these static meshes and use a procedural routine to decide what to place in the zone.
      this.meshes.add(new StaticMeshes());

      // Add the zone light.
      const zonelight = new Light(C.ZONE_LIGHT.COLOR, C.ZONE_LIGHT.INTENSITY, `zonelight-${this.meshes.name}`);
      this.meshes.add(zonelight);
      zonelight.position.set(0, 10, 0); // Positioned in relation to this zone.

      console.log(`${this.name} is ready.`)

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
        north: { x: this.x * C.ZONE_SIZE, z: (this.z - 1) * C.ZONE_SIZE, name: `zone${this.x}:${this.z - 1}` },
        south: { x: this.x * C.ZONE_SIZE, z: (this.z + 1) * C.ZONE_SIZE, name: `zone${this.x}:${this.z + 1}` },
        east: { x: (this.x + 1) * C.ZONE_SIZE, z: this.z * C.ZONE_SIZE, name: `zone${this.x + 1}:${this.z}` },
        west: { x: (this.x - 1) * C.ZONE_SIZE, z: this.z * C.ZONE_SIZE, name: `zone${this.x - 1}:${this.z}` },
        northEast: { x: (this.x + 1) * C.ZONE_SIZE, z: (this.z - 1) * C.ZONE_SIZE, name: `zone${this.x + 1}:${this.z - 1}` },
        southEast: { x: (this.x + 1) * C.ZONE_SIZE, z: (this.z + 1) * C.ZONE_SIZE, name: `zone${this.x + 1}:${this.z + 1}` },
        southWest: { x: (this.x - 1) * C.ZONE_SIZE, z: (this.z + 1) * C.ZONE_SIZE, name: `zone${this.x - 1}:${this.z + 1}` },
        northWest: { x: (this.x - 1) * C.ZONE_SIZE, z: (this.z - 1) * C.ZONE_SIZE, name: `zone${this.x - 1}:${this.z - 1}` },
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

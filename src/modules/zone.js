define(['constants', 'ground', 'round'], (C, Ground, round) => {
  class Zone {
    constructor(x, z, loadedZones) {
      // Origin at scale C.ZONE_SIZE of this zone based on input from camera position.
      this.x = this.scaleCoordinate(x);
      this.z = this.scaleCoordinate(z);
      this.name = this.getZoneName(x, z);

      // Check if the meshes are already created with the name either found or not in loadedZones array.
      if (loadedZones.indexOf(this.name) === -1) {
        this.meshes = this.createMeshes();
      }

      // Beyond a zone line, the current zone should be updated.
      this.lines = {
        north: this.z * C.ZONE_SIZE - (C.ZONE_SIZE / 2),
        south: this.z * C.ZONE_SIZE + (C.ZONE_SIZE / 2),
        east: this.x * C.ZONE_SIZE + (C.ZONE_SIZE / 2),
        west: this.x * C.ZONE_SIZE - (C.ZONE_SIZE / 2),
      };

      // Near the zone edges, the adjacent zones should be loaded.
      this.edges = {
        north: this.lines.north + C.ZONE_BUFFER,
        south: this.lines.south - C.ZONE_BUFFER,
        east: this.lines.east - C.ZONE_BUFFER,
        west: this.lines.west + C.ZONE_BUFFER,
      };

      // Last step.
      return this;
    }

    log(name) {
      return console.log(`[INFO] ${name} is loaded.`);
    }

    // Create all the static meshes of this zone.
    createMeshes(meshes = new THREE.Object3D()) {
      // Place the parent at the correct co-ordinates based on camera current position.
      meshes.position.set(this.x * C.ZONE_SIZE, 0, this.z * C.ZONE_SIZE)

      // Identify a zone name from the camera x and z position.
      meshes.name = this.name;

      // Check if the creation already happened in a previous game and was persisted to localStorage.
      if (localStorage[this.name]) {
        return this.createMeshesFromPersistedData(meshes);
      }

      // Add the ground.
      const ground = new Ground(`ground-${meshes.name}`);
      meshes.add(ground);
      ground.position.set(ground.persist.p[0], ground.persist.p[1], ground.persist.p[2]); // Position of the ground is relative to its own zone.

      // Last step: persist the zone.
      this.persistData(meshes);

      this.log(this.name);

      return meshes;
    }

    // Create all the static meshes of this zone from a previous game persisted in localStorage.
    createMeshesFromPersistedData(meshes = new THREE.Object3D()) {
      const data = JSON.parse(localStorage[this.name]);

      // Add all static meshes in a generic way, based on the persist data stored in localStorage.
      data.map(d => {
        const module = require([d.c], (Module) => {
          const instance = new Module(d.i);
          meshes.add(instance);
          instance.position.set(d.p[0], d.p[1], d.p[2]);
        });
      });

      this.log(this.name);

      return meshes;
    }

    persistData(meshes) {
      const data = meshes.children.map(mesh => mesh.persist);
      localStorage[this.name] = JSON.stringify(data);
    }

    // From a given coordinate not to scale, from camera for example, get the zone scaled x coordinate.
    scaleCoordinate(input) {
      return parseInt(round(input / C.ZONE_SIZE));
    }

    // From a given x and z, return what the name of the zone would be.
    getZoneName(x, z) {
      return `zone${this.scaleCoordinate(x)}:${this.scaleCoordinate(z)}`;
    }

    // For a given x and z, from the camera current position, return if that location is beyond the zone lines.
    isOutsideZone(x, z) {
      return z < this.lines.north || z > this.lines.south || x < this.lines.west || x > this.lines.east;
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

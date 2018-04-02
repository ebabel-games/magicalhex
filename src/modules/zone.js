define(['constants', 'round', 'ground', 'grid', 'trunk'], (C, round, Ground, Grid, Trunk) => {
  // A zone comes from three type of sources:
  // 1. Never visited before, needs to be generated procedurally.
  // 2. Not loaded yet in the current game but has been stored in the past and can be re-built from localStorage.
  // 3. Already loaded in the current game, its meshes just need to be assigned to this.meshes from memory.
  class Zone {
    constructor(x, z, loadedZones, scene) {
      // Origin at scale C.ZONE_SIZE of this zone based on input from camera position.
      this.x = this.scaleCoordinate(x);
      this.z = this.scaleCoordinate(z);
      this.name = this.getZoneName(x, z);

      // Keep track of the whole scene to make dynamic changes to the zone possible.
      this.scene = scene;

      // Check if this zone has already been loaded.
      if (loadedZones.indexOf(this.name) === -1) {
        // Create meshes since this zone hasn't been loaded.
        this.meshes = this.createMeshes();
      } else {
        // The meshes have already been created, so assign them to this.meshes from memory in current game.
        this.meshes = scene.getObjectByName(this.name).children;
      }
      
      this.lines = this.getLines();      
      this.edges = this.getEdges();

      // Last step.
      return this;
    }

    // Beyond a zone line, the current zone should be updated.
    getLines() {
      return {
        north: this.z * C.ZONE_SIZE - (C.ZONE_SIZE / 2),
        south: this.z * C.ZONE_SIZE + (C.ZONE_SIZE / 2),
        east: this.x * C.ZONE_SIZE + (C.ZONE_SIZE / 2),
        west: this.x * C.ZONE_SIZE - (C.ZONE_SIZE / 2),
      };
    }

    // Near the zone edges, the adjacent zones should be loaded.
    getEdges() {
      return {
        north: this.lines.north + C.ZONE_BUFFER,
        south: this.lines.south - C.ZONE_BUFFER,
        east: this.lines.east - C.ZONE_BUFFER,
        west: this.lines.west + C.ZONE_BUFFER,
      };
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
        // This zone has already been visited in the past, build it from localStorage.
        return this.createMeshesFromPersistedData(meshes);
      } else {
        // This zone has never been visired by the player before in any game, generate it from scratch.
        return this.generateMeshesProcedurally(meshes);
      }
    }

    // Create all the static meshes of this zone from a previous game persisted in localStorage.
    createMeshesFromPersistedData(meshes = new THREE.Object3D()) {
      const data = JSON.parse(localStorage[this.name]);

      // Add all static meshes in a generic way, based on the persist data stored in localStorage.
      data.map(d => {
        const module = require([d.c], (Module) => {
          let instance;

          if (d.i) {
            // Constructor has several input parameters.
            instance = new Module(d.i);
          } else {
            // Constructor only needs a name.
            instance = new Module(d.n);
            instance.position.set(d.p[0], d.p[1], d.p[2]);
          }

          meshes.add(instance);
        });
      });

      this.log(this.name);

      return meshes;
    }

    toggleGrid() {
      const gridMesh = this.scene.getObjectByName(`grid-${this.name}`);

      if (gridMesh) {
        gridMesh.visible = !gridMesh.visible;
      }
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

    // This zone has never been visited in any game, ever. Create its meshes for the very first time.
    generateMeshesProcedurally(meshes) {
      // Add the ground.
      const ground = new Ground(`ground-${meshes.name}`);
      meshes.add(ground);
      ground.position.set(ground.persist.p[0], ground.persist.p[1], ground.persist.p[2]); // Position of the ground is relative to its own zone.

      // Add a grid.
      const grid = new Grid(`grid-${meshes.name}`);
      meshes.add(grid);
      grid.position.set(grid.persist.p[0], grid.persist.p[1], grid.persist.p[2])

      // todo: Create a string map.

      // todo: Place trunks based on the random string map.
      // test: row of trunks
      let trunkNumber = 0;
      for (let x = -499; x <= 499; x += 2) {
        const trunk = new Trunk({
          name: `trunk${trunkNumber}-${meshes.name}`,
          x,
          y: 0,
          z: -21,
        });
        meshes.add(trunk);
        trunkNumber += 1;
      }

      // Last step: persist the zone for future re-use.
      this.persistData(meshes);

      this.log(this.name);

      return meshes;
    }
  }

  return Zone;
});

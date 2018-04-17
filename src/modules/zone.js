define(['constants', 'round', 'degrees-to-radians', 'ground', 'grid', 'trunk', 'base-tree', 'wall', 'area-maps'], (C, round, degreesToRadians, Ground, Grid, Trunk, BaseTree, Wall, AreaMaps) => {
  // A zone comes from three type of sources:
  // 1. Never visited before, needs to be generated procedurally.
  // 2. Not loaded yet in the current game but has been stored in
  // the past and can be re-built from localStorage.
  // 3. Already loaded in the current game, its meshes just need
  // to be assigned to this.meshes from memory.
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
        // The meshes have already been created, so assign
        // them to this.meshes from memory in current game.
        this.meshes = scene.getObjectByName(this.name);
      }

      this.lines = this.getLines();
      this.edges = this.getEdges();

      // Last step.
      return this;
    }

    // Beyond a zone line, the current zone should be updated.
    getLines() {
      return {
        north: (this.z * C.ZONE_SIZE) - (C.ZONE_SIZE / 2),
        south: (this.z * C.ZONE_SIZE) + (C.ZONE_SIZE / 2),
        east: (this.x * C.ZONE_SIZE) + (C.ZONE_SIZE / 2),
        west: (this.x * C.ZONE_SIZE) - (C.ZONE_SIZE / 2)
      };
    }

    // Near the zone edges, the adjacent zones should be loaded.
    getEdges() {
      return {
        north: this.lines.north + C.ZONE_BUFFER,
        south: this.lines.south - C.ZONE_BUFFER,
        east: this.lines.east - C.ZONE_BUFFER,
        west: this.lines.west + C.ZONE_BUFFER
      };
    }

    log(name) {
      console.log(`[INFO] ${name || this.name} is loaded.`);
    }

    // Create all the static meshes of this zone.
    createMeshes(meshes = new THREE.Object3D()) {
      // Place the parent at the correct co-ordinates based on camera current position.
      meshes.position.set(this.x * C.ZONE_SIZE, 0, this.z * C.ZONE_SIZE);

      // Identify a zone name from the camera x and z position.
      meshes.name = this.name;

      // Check if the creation already happened in a previous game
      // and was persisted to localStorage.
      if (localStorage[this.name]) {
        // This zone has already been visited in the past, build it from localStorage.
        return this.createMeshesFromPersistedData(meshes);
      }

      // This zone has never been visired by the player before
      // in any game, generate it from scratch.
      return this.generateMeshesProcedurally(meshes);
    }

    // Create all the static meshes of this zone from a previous game persisted in localStorage.
    createMeshesFromPersistedData(meshes = new THREE.Object3D()) {
      const data = JSON.parse(localStorage[this.name]);

      // Add all static meshes in a generic way, based on the persist data stored in localStorage.
      data.map(d => {
        const module = require([d.c], (Module) => {
          const instance = new Module(d.i);
          meshes.add(instance);
        });

        return module;
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

    toggleGround() {
      const groundMesh = this.scene.getObjectByName(`ground-${this.name}`);

      if (groundMesh) {
        groundMesh.visible = !groundMesh.visible;
      }
    }

    persistData(meshes) {
      const data = meshes.children.map(mesh => mesh.persist);

      try {
        localStorage[this.name] = JSON.stringify(data);
      } catch (ex) {
        // Failed to persist the data to localStorage.
        console.error(ex);
      }
    }

    // From a given coordinate not to scale, from camera
    // for example, get the zone scaled x coordinate.
    scaleCoordinate(input) {
      return parseInt(round(input / C.ZONE_SIZE), 10);
    }

    // From a given x and z, return what the name of the zone would be.
    getZoneName(x, z) {
      return `zone${this.scaleCoordinate(x)}:${this.scaleCoordinate(z)}`;
    }

    // For a given x and z, from the camera current position,
    // return if that location is beyond the zone lines.
    isOutsideZone(x, z) {
      return z < this.lines.north || z > this.lines.south
        || x < this.lines.west || x > this.lines.east;
    }

    // For a given x and z, from the camera current position for example,
    // return if that position is on one or several edges for this zone.
    isOnEdge(x, z) {
      return {
        isOnNorthEdge: z < this.edges.north,
        isOnSouthEdge: z > this.edges.south,
        isOnEastEdge: x > this.edges.east,
        isOnWestEdge: x < this.edges.west
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
        northWest: { x: (this.x - 1) * C.ZONE_SIZE, z: (this.z - 1) * C.ZONE_SIZE, name: `zone${this.x - 1}:${this.z - 1}` }
      };
    }

    // This zone has never been visited in any game, ever.
    // Create its meshes for the very first time.
    generateMeshesProcedurally(meshes) {
      // Add the ground.
      const ground = new Ground({ name: `ground-${meshes.name}` });
      meshes.add(ground);

      // Add a grid.
      const grid = new Grid({ name: `grid-${meshes.name}` });
      meshes.add(grid);

      // Create a map for this new zone, from area maps.
      const zoneMap = new AreaMaps();

      // Place trunks based on the random string map.
      let x = -499;
      let z = -499;
      zoneMap.map((row) => {
        row.split('').map((cell) => {
          // Randomized tree trunk.
          if (cell === 't') {
            const radius = round(Math.random() * 0.5, 2) + 0.5;
            const height = round(Math.random() * 0.5, 2) + 0.5;
            const trunk = new Trunk({
              name: `trunk${x}:${z}-${meshes.name}`,
              x,
              y: round(height / 2, 2),
              z,
              v: round(degreesToRadians(Math.random() * 360), 2), // Vertical rotation.
              t: radius - 0.05,
              b: radius,
              h: height,
              r: round(Math.random() * 4) + 5 // Radial segments.
            });
            meshes.add(trunk);
          }

          if (cell === 'T') {
            const height = round(Math.random() * 5, 2) + 8;
            const baseTree = new BaseTree({
              name: `basetree${x}:${z}-${meshes.name}`,
              x,
              y: round(height - 2, 2),
              z,
              v: round(degreesToRadians(Math.random() * 360), 2),
              h: height,
              t: (height > 10) ? C.BASE_TREE.RADIUS_TOP * 1.5 : C.BASE_TREE.RADIUS_TOP,
              b: (height > 10) ? C.BASE_TREE.RADIUS_BOTTOM * 1.5 : C.BASE_TREE.RADIUS_BOTTOM,
              r: (height > 10) ? C.BASE_TREE.RADIAL_SEGMENTS : 5
            });
            meshes.add(baseTree);
          }

          // Low wall, top edge is below player line of sight (default).
          if (cell === 'w') {
            const wall = new Wall({
              name: `wall${x}:${z}-${meshes.name}`,
              x,
              z
            });
            meshes.add(wall);
          }

          // Tall wall, top edge is above player line of sight.
          if (cell === 'W') {
            const wall = new Wall({
              name: `wall${x}:${z}-${meshes.name}`,
              x,
              y: 2,
              z,
              h: 4
            });
            meshes.add(wall);
          }

          x += C.ZONE_UNIT_SIZE;
        });
        z += C.ZONE_UNIT_SIZE;
        x = -499;
      });

      // Last step: persist the zone for future re-use.
      this.persistData(meshes);

      this.log(this.name);

      return meshes;
    }
  }

  return Zone;
});

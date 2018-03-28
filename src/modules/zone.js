define(['ground', 'static-meshes'], (ground, StaticMeshes) => {
  class Zone {
    constructor(x, z) {
      // Main container for all static meshes that make up a zone.
      const meshes = new THREE.Object3D();

      // Identify a zone name from the camera x and z position.
      // Any x from -500 to 500 and z from -500 to 500 is the zone 'origin' at 0:0
      // todo: calculate the name of the zone based on the x and z input.
      meshes.name = 'zone0:0';

      // Add the ground.
      meshes.add(ground(`ground-${meshes.name}`));

      // Add the test static meshes.
      // todo: delete these static meshes and use a procedural routine to decide what to place in the zone.
      meshes.add(new StaticMeshes());
      
      // Last step.
      return meshes;
    }
  }

  return Zone;
});

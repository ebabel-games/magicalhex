define([], () => {
  class Cube {
    constructor(size = 1, wireframe = false, color = 0xff0000) {
      const box = new THREE.BoxBufferGeometry(size, size, size);
      let geometry = box;
      let material;

      if (wireframe) {
        geometry = new THREE.WireframeGeometry(box);
        material = new THREE.LineBasicMaterial({ color });
        return new THREE.LineSegments(geometry, material);
      }

      material = new THREE.MeshLambertMaterial({ color });

      return new THREE.Mesh(geometry, material);
    }
  }

  return Cube;
});

define(['constants', 'rotate-to-horizontal'], (C, rotateToHorizontal) => {
  class Grid {
    constructor(name, width = C.ZONE_SIZE / 2, height = C.ZONE_SIZE / 2, linesHeight = C.GRID.LINES_HEIGHT, linesWidth = C.GRID.LINES_WIDTH, color = C.GRID.COLOR) {
      if (!name) {
        throw new Error(C.ERROR.MISSING_PARAMETERS);
      }

      const material = new THREE.LineBasicMaterial({
        color: color,
        opacity: 0.2
      });
    
      const mesh = new THREE.Object3D();
      const geometry = new THREE.Geometry();
      const stepw = 2 * width / linesWidth;
      const steph = 2 * height / linesHeight;
    
      // Width.
      for (let i = -width; i <= width; i += stepw) {
        geometry.vertices.push(new THREE.Vector3(-height, i, 0));
        geometry.vertices.push(new THREE.Vector3(height, i, 0));
      }

      // Height.
      for (let i = -height; i <= height; i += steph) {
        geometry.vertices.push(new THREE.Vector3(i, -width, 0));
        geometry.vertices.push(new THREE.Vector3(i, width, 0));
      }
    
      const line = new THREE.LineSegments (geometry, material, THREE.LinePieces);

      mesh.add(line);
      mesh.name = name;
      rotateToHorizontal(mesh);

      mesh.persist = {
        n: name,
        c: 'Grid',
        i: [name, width, height, linesHeight, linesWidth, color],
        p: [0, 0.1, 0],
      };
    
      return mesh;
    }
  }

  return Grid;
});

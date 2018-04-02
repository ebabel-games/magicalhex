define(['constants', 'rotate-to-horizontal'], (C, rotateToHorizontal) => {
  class Grid {
    constructor(name) {
      if (!name) {
        throw new Error(C.ERROR.MISSING_PARAMETERS);
      }

      const width = C.ZONE_SIZE / 2;
      const height = C.ZONE_SIZE / 2;
      const linesHeight = C.GRID.LINES_HEIGHT;
      const linesWidth = C.GRID.LINES_WIDTH;
      const color = C.GRID.COLOR;

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
    
      const line = new THREE.LineSegments(geometry, material, THREE.LinePieces);

      mesh.add(line);
      mesh.name = name;
      mesh.visible = false; // By default, the grid of each zone is invisible, unless toggled by the debug mode.
      rotateToHorizontal(mesh);

      mesh.persist = {
        n: name,
        c: 'Grid',
        p: [0, 0.01, 0],
      };
    
      return mesh;
    }
  }

  return Grid;
});

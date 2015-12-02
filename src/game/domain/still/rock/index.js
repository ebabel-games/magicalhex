import THREE from 'three';

class Rock {
    constructor (input) {
        // Rock texture.
        const rockTexture = THREE.ImageUtils.loadTexture('rock.jpg');
        rockTexture.wrapS = THREE.RepeatWrapping;
        rockTexture.wrapT = THREE.RepeatWrapping;
        rockTexture.repeat.set(0.75, 0.75);

        // Rock custom geometry.
        const rockGeometry = new THREE.Geometry();

        // Vertices (points that delimitate faces).
        rockGeometry.vertices.push(new THREE.Vector3(-2, 0, -14));  // 0
        rockGeometry.vertices.push(new THREE.Vector3(-6, 0, -10));  // 1
        rockGeometry.vertices.push(new THREE.Vector3(-8, 0, 0));    // 2
        rockGeometry.vertices.push(new THREE.Vector3(-6, 0, 8));    // 3
        rockGeometry.vertices.push(new THREE.Vector3(2, 0, 10));    // 4
        rockGeometry.vertices.push(new THREE.Vector3(8, 0, 4));     // 5
        rockGeometry.vertices.push(new THREE.Vector3(8, 0, 0));     // 6
        rockGeometry.vertices.push(new THREE.Vector3(6, 0, -10));   // 7
        rockGeometry.vertices.push(new THREE.Vector3(-6, 1, -1));   // 8
        rockGeometry.vertices.push(new THREE.Vector3(0, 4, 6));     // 9
        rockGeometry.vertices.push(new THREE.Vector3(6, 4, 2));     // 10
        rockGeometry.vertices.push(new THREE.Vector3(0, 6, -8));    // 11

        // Faces (flat areas).
        rockGeometry.faces.push(new THREE.Face3(0, 1, 11));         // A
        rockGeometry.faces.push(new THREE.Face3(1, 8, 11));         // B
        rockGeometry.faces.push(new THREE.Face3(1, 2, 8));          // C
        rockGeometry.faces.push(new THREE.Face3(2, 3, 8));          // D
        rockGeometry.faces.push(new THREE.Face3(3, 9, 8));          // E
        rockGeometry.faces.push(new THREE.Face3(3, 4, 9));          // F
        rockGeometry.faces.push(new THREE.Face3(4, 5, 9));          // G
        rockGeometry.faces.push(new THREE.Face3(5, 6, 10));         // H
        rockGeometry.faces.push(new THREE.Face3(6, 7, 10));         // I
        rockGeometry.faces.push(new THREE.Face3(7, 0, 11));         // J
        rockGeometry.faces.push(new THREE.Face3(8, 9, 11));         // K
        rockGeometry.faces.push(new THREE.Face3(5, 10, 9));         // L
        rockGeometry.faces.push(new THREE.Face3(7, 11, 10));        // M
        rockGeometry.faces.push(new THREE.Face3(9, 10, 11));        // N

        // UVs to map faces to the texture.
        rockGeometry.faces.map(function (face) {
            rockGeometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]);
        });

        rockGeometry.mergeVertices();
        rockGeometry.computeFaceNormals();
        rockGeometry.computeVertexNormals();

        // Rock mesh.
        const rock = new THREE.Mesh(
            rockGeometry, 
            new THREE.MeshLambertMaterial({
                map: rockTexture
            })
        );

        rock.name = 'rock';

        return rock;
    }
}

module.exports = Rock;


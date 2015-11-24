import THREE from 'three';

import plotModelsOnGrid from './plotModelsOnGrid';

// Load all the still models of a given domain as a single group.
module.exports = function loadStills (input) {

    // Keep track of the domain instance scope.
    const _this = this;

    // Ground.
    const groundTexture = THREE.ImageUtils.loadTexture('ground.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(1000/256, 1000/256);
    const ground = {
        geometry: new THREE.PlaneGeometry(1000, 1000),
        material: new THREE.MeshLambertMaterial({map: groundTexture, side: THREE.DoubleSide})
    };
    ground.mesh = new THREE.Mesh(ground.geometry, ground.material);
    ground.mesh.rotation.set(-90 * Math.PI / 180, 0, 0);

    // Add the ground to the domain.
    _this.still.add(ground.mesh);

    // Tree trunk.
    const trunkTexture = THREE.ImageUtils.loadTexture('wood.jpg');
    const trunk = {
        geometry: new THREE.CylinderGeometry(6, 9, 90, 5, 1),
        material: new THREE.MeshLambertMaterial({map: trunkTexture})
    };
    trunk.mesh = new THREE.Mesh(trunk.geometry, trunk.material);
    // Note: the position is from the center co-ordinates of the model, 
    // therefore y should be half of the total height.
    trunk.mesh.position.set(0, 45, 0);

    // Tree foliage.
    const foliageTexture = THREE.ImageUtils.loadTexture('foliage.png');
    const foliage = {
        geometry: new THREE.PlaneGeometry(128, 64),
        material: new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5})
    };
    foliage.mesh = new THREE.Mesh(foliage.geometry, foliage.material);
    foliage.mesh.position.set(0, 110, 0);
    const foliage2 = foliage.mesh.clone();
    foliage2.rotation.set(0, 90 * Math.PI / 180, 0);

    // Tree.
    const tree = new THREE.Group();
    tree.add(trunk.mesh);
    tree.add(foliage.mesh);
    tree.add(foliage2);

    // Forest.
    const forest = plotModelsOnGrid({
        model: tree,
        numberModelsToPlot: 800,
        scale: { min: 0.16, max: 0.2 },
        rotate: true
    });

    // Add the forest to the domain.
    _this.still.add(forest.group);

    // Cut-down tree trunks.
    const cutTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 2, 5, 1),
        new THREE.MeshLambertMaterial({map: trunkTexture})
    );
    const cutTrunks = plotModelsOnGrid({
        group: forest.group,
        freeGridPositions: forest.freeGridPositions,
        model: cutTrunk,
        numberModelsToPlot: 100,
        positionY: 0,
        rotate: true,
        scale: {
            min: 0.4,
            max: 0.6
        }
    });
    // Add the cut-down trunks to the domain.
    _this.still.add(cutTrunks.group);

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

    rockGeometry.computeFaceNormals();
    rockGeometry.computeVertexNormals();


    // Rock mesh.
    const rock = new THREE.Mesh(
        rockGeometry, 
        new THREE.MeshLambertMaterial({
            map: rockTexture
        })
    );

    // Rocks.
    const rocks = plotModelsOnGrid({
        group: cutTrunks.group,
        freeGridPositions: cutTrunks.freeGridPositions,
        model: rock,
        numberModelsToPlot: 50,
        positionY: 0,
        rotate: true,
        scale: {
            min: 0.15,
            max: 0.3
        }
    });

    // Add the rocks to the domain.
    _this.still.add(rocks.group);
};

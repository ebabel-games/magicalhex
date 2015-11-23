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
        material: new THREE.MeshLambertMaterial({map: groundTexture, fog: true, side: THREE.DoubleSide})
    };
    ground.mesh = new THREE.Mesh(ground.geometry, ground.material);
    ground.mesh.rotation.set(-90 * Math.PI / 180, 0, 0);

    // Add the ground to the domain.
    _this.still.add(ground.mesh);

    // Tree trunk.
    const trunkTexture = THREE.ImageUtils.loadTexture('wood.jpg');
    const trunk = {
        geometry: new THREE.CylinderGeometry(6, 9, 90, 3, 1),
        material: new THREE.MeshLambertMaterial({map: trunkTexture, fog: true})
    };
    trunk.mesh = new THREE.Mesh(trunk.geometry, trunk.material);
    // Note: the position is from the center co-ordinates of the model, 
    // therefore y should be half of the total height.
    trunk.mesh.position.set(0, 45, 0);

    // Tree foliage.
    const foliageTexture = THREE.ImageUtils.loadTexture('foliage.png');
    const foliage = {
        geometry: new THREE.PlaneGeometry(128, 64),
        material: new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5, fog: true})
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

    // Spikes: use the previously added forest to make sure the same position isn't re-used.
    const spikes = plotModelsOnGrid({
        group: forest.group,
        freeGridPositions: forest.freeGridPositions,
        model: new THREE.Mesh(
            new THREE.CylinderGeometry(0, 2, 12, 3), 
            new THREE.MeshLambertMaterial({map: trunkTexture, fog: true})),
        numberModelsToPlot: 7,
        positionY: 6,
        scale: false
    });

    // Add the spikes to the domain.
    _this.still.add(spikes.group);
}
import THREE from 'three';

class Tree {
    constructor (input) {
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

        tree.name = 'tree';

        return tree;
    }
}

module.exports = Tree;

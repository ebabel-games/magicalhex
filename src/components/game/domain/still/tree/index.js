import THREE from 'three';

class Tree {
    constructor (input) {
        const foliageImage = input && input.foliageImage || 'foliage.png';
        const trunkImage = input && input.trunkImage || 'wood.jpg';
        const trunkTop = input && input.trunkTop || 6;
        const trunkBase = input && input.trunkBase || 9;
        const trunkSides = input && input.trunkSides || 5;
        const foliagePositionY = input && input.foliagePositionY || 110;
        const foliageWidth = input && input.foliageWidth || 128;
        const foliageHeight = input && input.foliageHeight || 64;

        // Tree trunk.
        const trunkTexture = THREE.ImageUtils.loadTexture(trunkImage);
        const trunk = {
            geometry: new THREE.CylinderGeometry(trunkTop, trunkBase, 90, trunkSides, 1),
            material: new THREE.MeshLambertMaterial({map: trunkTexture})
        };
        trunk.mesh = new THREE.Mesh(trunk.geometry, trunk.material);
        // Note: the position is from the center co-ordinates of the model, 
        // therefore y should be half of the total height.
        trunk.mesh.position.set(0, 45, 0);

        // Tree foliage.
        const foliageTexture = THREE.ImageUtils.loadTexture(foliageImage);
        const foliage = {
            geometry: new THREE.PlaneGeometry(foliageWidth, foliageHeight),
            material: new THREE.MeshLambertMaterial({map: foliageTexture, side: THREE.DoubleSide, alphaTest: 0.5})
        };
        foliage.mesh = new THREE.Mesh(foliage.geometry, foliage.material);
        foliage.mesh.position.set(0, foliagePositionY, 0);
        const foliage2 = foliage.mesh.clone();
        foliage2.rotation.set(0, 90 * Math.PI / 180, 0);

        // Tree.
        const tree = new THREE.Group();
        tree.add(trunk.mesh);
        tree.add(foliage.mesh);
        tree.add(foliage2);

        tree.name = input && input.treeName || 'tree';

        return tree;
    }
}

module.exports = Tree;

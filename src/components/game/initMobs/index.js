import THREE from 'three';

import testCube from './test-cube';
import monkey from './monkey';
import Human from './human';
import plane from './plane';

// Initialize the mobs to load.
const initMobs = function initMobs (input) {

    // The testCube is a test mob used during development.
    testCube(input);

    // The monkey is also a test mob used during development.
    monkey(input);

    const centralHuman = new Human({
        scene: input.scene,
        url: '/json-models/human/human.json',
        material: new THREE.MeshLambertMaterial({color: 0x654321, fog: true})
    });

    plane(input);

    // Return the mob unique names that will be rendered.
    return ['test-cube', 'monkey', 'human', 'plane'];
}

module.exports = initMobs;

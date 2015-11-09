import THREE from 'three';

import loadModel from '../../loadModel';

const mob = function mob (input) {

    const scene = input.scene;

    loadModel({
        url: '/json-models/plane/plane.json',
        material: new THREE.MeshLambertMaterial({color: 0x003300, fog: true}),
        modelName: 'plane',
        scene: scene,
        firebaseEndpoint: 'world/plane',
        userData: {
            // Start is a fallback, in case there is no data in Firebase.
            start: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    });

    return this;
}

module.exports = mob;

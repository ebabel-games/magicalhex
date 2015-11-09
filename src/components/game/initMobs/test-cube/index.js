import THREE from 'three';

import loadModel from '../../loadModel';
import heartbeat from './heartbeat';
import takeDamage from '../../takeDamage';

const mob = function mob (input) {

    const scene = input.scene;

    loadModel({
        url: '/json-models/test-cube/test-cube.json',
        material: new THREE.MeshLambertMaterial({color: 0x654321, fog: true}),
        modelName: 'test-cube',
        scene: scene,
        firebaseEndpoint: 'mobs/test-cube',
        userData: {
            targetName: 'a cube',

            life: 1,
            dead: false,

            // List all the corpses this sprite currently has.
            corpses: [],

            // Start is a fallback, in case there is no data in Firebase.
            start: {
                x: 5,
                y: 30,
                z: -45
            },

            equipment: [],

            heartbeat: heartbeat,

            takeDamage: takeDamage
        }
    });

    return this;
}

module.exports = mob;

import THREE from 'three';

import loadModel from '../../loadModel';
import heartbeat from './heartbeat';
import takeDamage from '../../takeDamage';

const mob = function mob (input) {

    const scene = input.scene;

    loadModel({
        url: '/models/test-cube/test-cube.json',
        material: new THREE.MeshLambertMaterial({color: 0xffffff}),
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

            equipment: [
                'armour',
                'sword',
                'spell scroll'
            ],

            heartbeat: heartbeat,

            takeDamage: takeDamage
        }
    });

    return this;
}

module.exports = mob;

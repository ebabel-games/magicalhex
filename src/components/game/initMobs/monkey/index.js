import THREE from 'three';

import loadModel from '../../loadModel';
import heartbeat from './heartbeat';
import takeDamage from '../../takeDamage';

const mob = function mob (input) {

    const scene = input.scene;

    loadModel({
        url: '/models/monkey/monkey.json',
        material: new THREE.MeshLambertMaterial({color: 0xffad60}),
        modelName: 'monkey',
        scene: scene,
        firebaseEndpoint: 'mobs/monkey',
        userData: {
            targetName: 'a monkey',

            life: 20,
            dead: false,

            // List all the corpses this sprite currently has.
            corpses: [],

            // Start is a fallback, in case there is no data in Firebase.
            start: {
                x: -5,
                y: 25,
                z: -45
            },

            equipment: [
                'banana',
                'monkey pelt'
            ],

            heartbeat: heartbeat,

            takeDamage: takeDamage
        }
    });

    return this;    
}

module.exports = mob;

import THREE from 'three';

import loadModel from '../../loadModel';
import takeDamage from '../../takeDamage';

const mob = function mob (input) {

    const scene = input.scene;

    loadModel({
        url: '/models/human/human.json',
        material: new THREE.MeshLambertMaterial({color: 0xffe0bd}),
        modelName: 'human',
        scene: scene,
        firebaseEndpoint: 'mobs/human',
        userData: {
            targetName: 'a human',

            life: 3,
            dead: false,

            // List all the corpses this sprite currently has.
            corpses: [],

            // Start is a fallback, in case there is no data in Firebase.
            start: {
                x: 1,
                y: 0,
                z: -15
            },

            equipment: [],

            takeDamage: takeDamage
        }
    });

    return this;    
}

module.exports = mob;

import THREE from 'three';
import Firebase from 'firebase';

import error from '../../shared/errorMessages';

// todo: load with a worker process

const loadModel = function loadModel (input) {

    const loader = new THREE.JSONLoader();

    // todo: validation of input and error handling.

    loader.load(input.userData.url || input.url, function (geometry, material) {

        const ref = new Firebase('https://enchantment.firebaseio.com');

        material = input.userData.material || input.material;

        const model = new THREE.Mesh(geometry, material);

        model.name = input.modelName;
        model.userData = input.userData;

        // Set the starting position of the model.
        model.position.set(
            model.userData.position.x,
            model.userData.position.y,
            model.userData.position.z
        );

        input.scene.add(model);
    });

    return this;
};

module.exports = loadModel;

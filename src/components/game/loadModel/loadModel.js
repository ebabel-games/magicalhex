import THREE from 'three';

import error from '../../shared/errorMessages';

// todo: load with a worker process

const loadModel = function loadModel (input) {

    const loader = new THREE.JSONLoader();

    // todo: validation of input and error handling.

    loader.load(input.url, function (geometry, material) {
        material = input.material;

        const model = new THREE.Mesh(geometry, material);

        model.name = input.modelName;

        // todo: use Firebase input.firebaseEndpoint to determine the position, rotation and any game data saved into the model, like Life.
        model.position.x = 5;
        model.position.y = 20;
        model.position.z = -45;

        input.scene.add(model);
    });

};

module.exports = loadModel;

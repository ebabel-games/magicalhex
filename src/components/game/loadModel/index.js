 import THREE from 'three';
import Firebase from 'firebase';

import error from '../../shared/errorMessages';

// todo: load with a worker process

const loadModel = function loadModel (input) {

    const loader = new THREE.JSONLoader();

    // todo: validation of input and error handling.

    loader.load(input.url, function (geometry, material) {

        const ref = new Firebase('https://enchantment.firebaseio.com');

        material = input.material;

        const model = new THREE.Mesh(geometry, material);


        model.name = input.modelName;
        model.userData = input.userData;

        ref.child(input.firebaseEndpoint).once('value', function getModelUserData (snapshot) {

            const userData = snapshot.val();

            // Update the start position from the Firebase data, if any.
            if (userData) {
                model.userData.start.x = userData.x;
                model.userData.start.y = userData.y;
                model.userData.start.z = userData.z;
            }

            // Set the starting position of the model.
            model.position.set(
                model.userData.start.x,
                model.userData.start.y,
                model.userData.start.z
            );

            input.scene.add(model);
        });
    });

};

module.exports = loadModel;

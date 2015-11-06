import THREE from 'three';
import Firebase from 'firebase';

import error from '../../shared/errorMessages';

// todo: load with a worker process

const loadModel = function loadModel (input) {

    const loader = new THREE.JSONLoader();
    const ref = Firebase(input.firebaseEndpoint);

    // todo: validation of input and error handling.

    loader.load(input.url, function (geometry, material) {


        material = input.material;

        const model = new THREE.Mesh(geometry, material);


        model.name = input.modelName;
        model.userData = input.userData;

        ref.once('value', function getModelUserData (snapshot) {

            const userData = snapshot.val();

            if (userData) {
                model.position.set(
                    userData.x,
                    userData.y,
                    userData.z
                );
            } else {
                model.position.set(
                    model.userData.start.x,
                    model.userData.start.y,
                    model.userData.start.z
                );
            }

            input.scene.add(model);
        });
    });

};

module.exports = loadModel;

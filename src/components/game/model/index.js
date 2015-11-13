import THREE from 'three';
import Firebase from 'firebase';

import error from '../../shared/errorMessages';

// Model is the base class for all other model classes.
// It cannot be interacted with, it doesn't move and it can't be targeted. 
// It doesn't take damage and has no Life points. 
// It has a geometry, a texture and a position.
class Model {

    constructor (input) {
        if (!input) {
            throw new Error(error.input.required);
        }

        // Unique endpoint of each model that is synced to Firebase.
        this.firebaseUrl = input.firebaseUrl;

        // todo: check if this instance already exists in Firebase. 
        // If so, populate it from Firebase, if not, create it in Firebase and keep it synced 
        // with change event from Firebase.

        // THREE.js model.
        if (input.geometry && input.material) {
            this.mesh = this.createMesh(input.geometry, input.material);
            this.mesh.name = input.name || 'model';
        }

        // THREE.js position.
        if (input.position && this.mesh) {
            this.mesh.position.set(
                input.position.x || 0, 
                input.position.y || 0, 
                input.position.z || 0
            );
        }

        // THREEE.js rotation.
        if (input.rotation && this.mesh) {
            this.mesh.rotation.set(
                input.rotation.x || 0,
                input.rotation.y || 0,
                input.rotation.z || 0
            );
        }

        return this;
    }

    createMesh (geometry, material) {
        return new THREE.Mesh(geometry, material);
    }

}

module.exports = Model;

import THREE from 'three';
import Firebase from 'firebase';

import error from '../../shared/errorMessages';

// Model is the base class for all other model classes.
// It cannot be interacted with, it doesn't move and it can't be targeted. 
// It doesn't take damage and has no Life points. 
// It has a geometry, a texture and a position.
class Model {


    populateFromFirebase() {
        const ref = new Firebase(this.firebaseUrl);

        ref.once('value', function (snapshot) {
            const data = snapshot.val();

        });
    }

    populateFromInput (input) {
        // Mesh name
        if (this.mesh) {
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
    }

    constructor (input) {
        if (!input) {
            throw new Error(error.input.required);
        }

        // THREE.js model.
        if (input.geometry && input.material) {
            this.mesh = this.createMesh(input.geometry, input.material);
        }

        // Unique endpoint of each model that is synced to Firebase.
        this.firebaseUrl = input.firebaseUrl;

        if (this.firebaseUrl) {
            this.populateFromFirebase();
        }

        if (!this.firebaseUrl) {
            this.populateFromInput(input);
        }

        return this;
    }

    createMesh (geometry, material) {
        return new THREE.Mesh(geometry, material);
    }

}

module.exports = Model;

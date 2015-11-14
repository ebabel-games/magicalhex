import THREE from 'three';
import Firebase from 'firebase';

import populateFromInput from './populateFromInput';
import populateFromFirebase from './populateFromFirebase';
import persistToFirebase from './persistToFirebase';

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

        // THREE.js model.
        if (input.geometry && input.material) {
            this.mesh = this.createMesh(input.geometry, input.material);
        }

        // Unique endpoint of each model that is synced to Firebase.
        this.firebaseUrl = input.firebaseUrl;

        this.populateFromInput = populateFromInput;
        this.populateFromFirebase = populateFromFirebase;
        this.persistToFirebase = persistToFirebase;

        if (this.firebaseUrl) {
            this.populateFromFirebase(input);
        } else {
            this.populateFromInput(input);
        }

        return this;
    }

    createMesh (geometry, material) {
        return new THREE.Mesh(geometry, material);
    }
}

module.exports = Model;

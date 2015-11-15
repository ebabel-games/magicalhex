import THREE from 'three';
import Firebase from 'firebase';

import populateFromInput from './populateFromInput';
import populateFromFirebase from './populateFromFirebase';
import persistToFirebase from './persistToFirebase';

import error from '../../shared/errorMessages';

// Model is the base class for all other model classes.
class Model {
    constructor (input) {
        if (!input || !input.firebaseUrl) {
            throw new Error(error.input.required);
        }

        // THREE.js model.
        this.mesh = new THREE.Mesh(
            input.geometry || new THREE.BoxGeometry(1, 1, 1),
            input.material || new THREE.MeshBasicMaterial( {color: 0xcccccc} )
        );

        // Unique endpoint of each model that is synced to Firebase.
        this.mesh.userData.firebaseUrl = input.firebaseUrl || null;

        this.populateFromInput = populateFromInput;
        this.populateFromFirebase = populateFromFirebase;
        this.persistToFirebase = persistToFirebase;

        if (this.mesh.userData.firebaseUrl) {
            this.populateFromFirebase(input);
        } else {
            this.populateFromInput(input);
        }

        return this;
    }
}

module.exports = Model;

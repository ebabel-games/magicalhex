import THREE from 'three';
import Firebase from 'firebase';

import keepInSync from './keep-in-sync';
import update from './update';

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
            input.material || new THREE.MeshBasicMaterial({color: 0xcccccc})
        );

        // Unique endpoint of each model that is synced to Firebase.
        this.mesh.userData.firebaseUrl = input.firebaseUrl;

        // Send data from game to Firebase.
        this.mesh.update = update;

        // Listen for data changes from Firebase to game.
        this.keepInSync = keepInSync;
        this.keepInSync();

        return this;
    }
}

module.exports = Model;

import THREE from 'three';
import Firebase from 'firebase';

import Model from '../model';

import heartbeat from './heartbeat';
import takeDamage from './takeDamage';

class Mob extends Model {

    constructor (input) {
        super(input);

        // Order the model to take some damage, which decreases its life points by the amount of damage.
        // There is no negotiation at this point, when calling this function, the model has no choice but to take damages.
        this.mesh.takeDamage = takeDamage;

        // Run the heartbeat at each game tick.
        this.mesh.heartbeat = heartbeat;

        // When a model is targetted, what name should it display.
        this.mesh.userData.targetName = input.targetName || 'a mob';

        // Every model has at least 1 life.
        this.mesh.userData.life = input.life || 1;

        // When a model loses all its life points, its flag switches to true.
        this.mesh.userData.dead = input.dead || false;

        this.mesh.userData.creation = {
            userData: JSON.parse(JSON.stringify(this.mesh.userData)),    // Make a deep copy.
            timestamp: Date.now()
        };

        // Keep track of this scope.
        const _this = this;

        // Register this mob to get synced to data when it changes on Firebase.
        function registerFirebase() {
            const ref = new Firebase(_this.mesh.userData.firebaseUrl);
            ref.on('value', callback);
        }

        // Update game's data in local object instances when data has been changed on Firebase.
        function callback (snapshot) {
            const data = snapshot.val();

            _this.mesh.userData = data.userData;
            _this.mesh.position.set(data.position.x, data.position.y, data.position.z);
            _this.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            _this.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
        }

        registerFirebase();

        return this;
    }

}

module.exports = Mob;

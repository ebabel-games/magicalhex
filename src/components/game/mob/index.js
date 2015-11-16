import THREE from 'three';

import Model from '../model';

import heartbeat from './heartbeat';
import takeDamage from './takeDamage';

class Mob extends Model {

    constructor (input) {
        super(input);

        // Run the heartbeat at each game tick.
        this.mesh.heartbeat = heartbeat;

        // Order the model to take some damage, which decreases its life points by the amount of damage.
        // There is no negotiation at this point, when calling this function, the model has no choice but to take damages.
        this.mesh.takeDamage = takeDamage;

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

        return this;
    }

}

module.exports = Mob;

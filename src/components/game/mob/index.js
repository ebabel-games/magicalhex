import THREE from 'three';

import Model from '../model';

import heartbeat from './heartbeat';
import takeDamage from './takeDamage';

// 3D models.
import human from './human';
import animal from './animal';

class Mob extends Model {

    constructor (input) {
        super(input);

        let _mesh;

        switch (input.race) {
            case 'animal':
                _mesh = animal(input);
                break;
            default:
                // Human is the default.
                _mesh = human(input);
        }

        // The new mesh needs to copy from the Model's mesh.
        _mesh.userData = this.mesh.userData;

        // Copy methods from the Model's mesh.
        _mesh.update = this.mesh.update;

        // Merge of inherited mesh and the new model are now the current mesh.
        this.mesh = _mesh;

        // Each mob needs to have a race (i.e. a custom 3D model).
        this.mesh.userData.race = input.race;

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
        // Note: do not update dead directly, it gets updated by isAlive.js
        this.mesh.userData.dead = input.dead || false;

        this.mesh.userData.creation = {
            userData: JSON.parse(JSON.stringify(this.mesh.userData)),    // Make a deep copy.
            timestamp: Date.now()
        };

        return this;
    }

}

module.exports = Mob;

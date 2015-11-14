import Model from '../model';

import heartbeat from './heartbeat';
import takeDamage from './takeDamage';

class Mob extends Model {

    constructor (input) {
        super(input);

        // If there isn't a mesh already created in Model class, maybe one has been provided in input.
        this.mesh = this.mesh || input.mesh;

        if (this.mesh) {
            this.mesh.userData = {
                // When a model is targetted, what name should it display.
                targetName: input.targetName || 'a mob',

                // Every model has at least 1 life.
                life: input.life || 1,

                // When a model loses all its life points, its flag switches to true.
                dead: input.dead || false,

                // Order the model to take some damage, which decreases its life points by the amount of damage.
                // There is no negotiation at this point, when calling this function, the model has no choice but to take damages.
                takeDamage: takeDamage,

                // Run the heartbeat at each game tick.
                heartbeat: heartbeat
            }

            this.mesh.userData.creation = {
                userData: JSON.parse(JSON.stringify(this.mesh.userData)),    // Make a deep copy.
                timestamp: Date.now()
            };
        }

        return this;
    }

}

module.exports = Mob;

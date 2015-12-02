import THREE from 'three';

import takeDamage from './takeDamage';
import fade from './fade';
import actions from './actions';

// A mob is either static or mobile, but it can always be 
// interacted with, contrary to the still models.
class Mob {
    constructor (input) {
        this.group = new THREE.Group();
        this.group.name = 'mob';

        this.group.userData = {
            targetName: 'a mob',
            maxLife: 2,
            life: 2,
            dead: false,
            timeOfDeath: null,
            respawnTime: 1000 * 60 * 3, // 3 minutes.

            // Actions run during the Render requestAnimationFrame.
            actions: actions,

            // When the mob is spawned, i.e. first introduced 
            // in the game or re-spawned after dying, it goes 
            // to this position with this rotation.
            spawn: {
                position: [],
                rotation: []
            },

            // Position on the y axis when dead.
            deathY: 0
        };

        this.group.takeDamage = takeDamage;
        this.group.fade = fade;




        return this;
    }



}

module.exports = Mob;

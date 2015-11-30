import THREE from 'three';

import takeDamage from './takeDamage';
import fade from './fade';

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
            actions: []
        };

        this.group.takeDamage = takeDamage;
        this.group.fade = fade;

        return this;
    }
}

module.exports = Mob;

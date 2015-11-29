import THREE from 'three';

import Model from '../../model';

// A mob is either static or mobile, but it can always be 
// interacted with, contrary to the still models.
class Mob extends Model {
    constructor (input) {
        super(input);

        this.name = 'mob';

        return this;
    }
}

module.exports = Mob;

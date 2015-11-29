import THREE from 'three';

// A mob is either static or mobile, but it can always be 
// interacted with, contrary to the still models.
class Mob {
    constructor (input) {
        super(input);

        this.name = 'mob';

        return this;
    }
}

module.exports = Mob;

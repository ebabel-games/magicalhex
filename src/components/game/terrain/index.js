import THREE from 'three';

import Model from '../model';

// Each terrain is a domain.
class Terrain extends Model {

    constructor (input) {
        super(input);

        this.mesh.name = input.name || 'terrain';

        // Player currently controlling this domain.
        if (this.mesh && this.mesh.userData) {
            this.mesh.userData.controlledByPlayer = input.controlledByPlayer;
        }

        return this;        
    }

}

module.exports = Terrain;

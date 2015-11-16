import THREE from 'three';

import Model from '../model';

// Each terrain is a domain.
class Terrain extends Model {

    constructor (input) {
        super(input);

        this.mesh.name = input.name || 'terrain';

        return this;        
    }

}

module.exports = Terrain;

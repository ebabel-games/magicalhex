import THREE from 'three';

import Model from '../model';

import loadMobs from './loadMobs';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        this.mesh.name = input.name || 'domain';

        this.loadMobs = loadMobs;

        this.loadMobs(input);

        return this;        
    }

}

module.exports = Domain;

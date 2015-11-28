import THREE from 'three';

import Model from '../model';

import generateStills from './generateStills';
import loadFirebaseStills from './loadFirebaseStills';
import loadMobs from './loadMobs';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        // Name of the domain.
        this.name = input && input.name;

        // Dimensions of the domain.
        this.width = input && input.width;
        this.height = input && input.height;



        // Still models that can't move. 
        // Add to the scene at the latest possible time, 
        // so that all still models are added together as one group.
        this.still = new THREE.Group();

        // Spawn all the still models from Firebase.
        this.generateStills = generateStills;
        this.loadFirebaseStills = loadFirebaseStills;
        this.loadFirebaseStills(input);


        // Mobs are models that can move or stand still, can be targetted and interacted with.
        this.mob = new THREE.Group();

        // Function to load the mobs (models that can move) that can be spawned in this domain.
        this.loadMobs = loadMobs;

        // Spawn all the mobs of this domain.
        this.loadMobs(input);
 
        return this;
    }

}

module.exports = Domain;

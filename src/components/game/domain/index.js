import THREE from 'three';

import Model from '../model';

import generateStills from './still/generateStills';
import loadFirebaseStills from './still/loadFirebaseStills';
import loadMobs from './mob/loadMobs';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        const _this = this;
        const _scene = input && input.scene;

        // Name of the domain.
        this.name = input && input.name;

        // Dimensions of the domain.
        this.width = input && input.width;
        this.height = input && input.height;

        // Still models that can't move. 
        this.still = new THREE.Group();

        // Spawn all the still models from Firebase.
        this.generateStills = generateStills;
        this.loadFirebaseStills = loadFirebaseStills;

        // When this event is emitted, it means the data has been found and can be added to the scene.
        this.ready = new CustomEvent('models-ready-to-add-in-scene', 
            { 
                'detail': {
                    'still': this.still
                }
            });

        // Listen for data being found.
        document.addEventListener('model-data-found', this.loadFirebaseStills.bind(this), true);        

        // Listen for data not being found.
        document.addEventListener('model-data-not-found', this.generateStills.bind(this), true);        

        // When models are ready to be added in scene, this is the event handler that does it.
        document.addEventListener('models-ready-to-add-in-scene', function modelsReadyToAddInScene() {
            _scene.add(_this.still);
        });



        // todo: refactor mob code below to be more like the still models.

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

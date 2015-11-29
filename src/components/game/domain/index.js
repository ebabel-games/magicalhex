import THREE from 'three';

import Model from '../model';

import generateStills from './still/generateStills';
import loadFirebaseStills from './still/loadFirebaseStills';

import init from '../render/init';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        const _this = this;
        const _renderer = input && input.renderer;
        const _scene = input && input.scene;
        const _camera = input && input.camera;

        // Name of the domain.
        this.name = input && input.name;

        // Dimensions of the domain.
        this.width = input && input.width;
        this.height = input && input.height;

        // Still models that can't move. 
        this.still = new THREE.Group();

        // Mobs are models that can move or stand still. 
        // They can be targetted and interacted with.
        this.mob = new THREE.Group();

        // Spawn all the still models either by generating them or
        // by reading them from Firebase.
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
        this.loadFirebase = function (event) {
            _this.loadFirebaseStills(event);
        };
        document.addEventListener('model-data-found', this.loadFirebase.bind(this), true);

        // Listen for data not being found.
        this.generate = function (event) {
            _this.generateStills(event);
        };
        document.addEventListener('model-data-not-found', this.generate.bind(this), true);

        // When models are ready to be added in scene, this is the event handler that does it.
        document.addEventListener('models-ready-to-add-in-scene', function modelsReadyToAddInScene() {
            _scene.add(_this.still);

            // Init the rendering of the domain 
            // with all its still and mob models.
            init({
                renderer: _renderer,
                scene: _scene,
                camera: _camera,
                domain: _this
            });
        });

        return this;
    }

}

module.exports = Domain;

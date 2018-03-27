

import Model from '../model';

import generate from './generate';
import loadFirebase from './loadFirebase';

import initRender from '../render/initRender';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        const _this = this;
        const _renderer = input && input.renderer;
        const _scene = input && input.scene;
        const _camera = input && input.camera;
        const _raycaster = input && input.raycaster;
        const _clock = input && input.clock;

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
        this.generate = generate;
        this.loadFirebase = loadFirebase;

        // When this event is emitted, it means the data has been found and can be added to the scene.
        this.ready = new CustomEvent('models-ready-to-add-in-scene', 
            { 
                detail: {
                    still: this.still,
                    mob: this.mob
                }
            });

        // Listen for data being found.
        document.addEventListener('model-data-found', this.loadFirebase.bind(this), true);

        // Listen for data not being found.
        document.addEventListener('model-data-not-found', this.generate.bind(this), true);

        // When models are ready to be added in scene, this is the event handler that does it.
        document.addEventListener('models-ready-to-add-in-scene', function modelsReadyToAddInScene() {
            _scene.add(_this.still);
            _scene.add(_this.mob);

            // Init the rendering of the domain 
            // with all its still and mob models.
            initRender({
                renderer: _renderer,
                scene: _scene,
                camera: _camera,
                raycaster: _raycaster,
                domain: _this,
                clock: _clock
            });
        });

        return this;
    }

}

module.exports = Domain;

import THREE from 'three';

import Human from './human';
import Animal from './animal';

import error from '../../../shared/errorMessages';

// Data has been found in Firebase and is passed to 
// this function via the custom event "model-data-found".
module.exports = function loadFirebaseMobs (event) {

    if (!event || !event.detail || !event.detail.data || !event.detail.data.mob) {
        return;
    }

    const _this = this;

    // All the possible mob models that can be cloned and placed in a domain.
    const human = new Human();
    const animal = new Animal();

    // Place all the mob models of a domain.
    event.detail.data.mob.map(function (mobData) {
        let mobModel = null;

        switch (mobData.name) {
            case 'human':
                mobModel = human.clone();
                break;
            case 'animal':
                mobModel = animal.clone();
                break;
            default:
                throw new Error('Model name: [' + mobData.name + ']. ' + error.model.unexpected);
                break;
        }

        mobModel.position.set(mobData.position[0], mobData.position[1], mobData.position[2]);
        mobModel.rotation.set(mobData.rotation[0], mobData.rotation[1], mobData.rotation[2]);
        mobModel.scale.set(mobData.scale[0], mobData.scale[1], mobData.scale[2]);

        _this.mob.add(mobModel);
    });

    // Emit event the models are ready to be added to the scene.
    document.dispatchEvent(_this.ready);
};

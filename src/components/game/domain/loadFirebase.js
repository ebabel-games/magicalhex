import THREE from 'three';

import Ground from './still/ground';
import Tree from './still/tree';
import Willow from './still/tree/willow';
import CutTrunk from './still/cutTrunk';
import Rock from './still/rock';

import Human from './mob/human';
import Animal from './mob/animal';

import error from '../../shared/errorMessages';

// Data has been found in Firebase and is passed to 
// this function via the custom event "model-data-found".
module.exports = function loadFirebase (event) {

    const _this = this;

    // All the still models that can be cloned and placed in a domain.
    const ground = new Ground({
        width: this.width,
        height: this.height
    });
    const tree = new Tree();
    const willow = new Willow();
    const cutTrunk = new CutTrunk();
    const rock = new Rock();

    // Place all still models of a domain.
    event.detail.data.still.map(function (stillData) {
        let stillModel = null;

        switch (stillData.name) {
            case 'tree':
                stillModel = tree.clone();
                break;
            case 'willow':
                stillModel = willow.clone();
                break;
            case 'cutTrunk':
                stillModel = cutTrunk.clone();
                break;
            case 'rock':
                stillModel = rock.clone();
                break;
            case 'ground':
                stillModel = ground.clone();
                break;
            default:
                throw new Error('Model name: [' + stillData.name + ']. ' + error.model.unexpected);
                break;
        }

        stillModel.position.set(stillData.position[0], stillData.position[1], stillData.position[2]);
        stillModel.rotation.set(stillData.rotation[0], stillData.rotation[1], stillData.rotation[2]);
        stillModel.scale.set(stillData.scale[0], stillData.scale[1], stillData.scale[2]);

        _this.still.add(stillModel);
    });

    // Place all mob models of a domain.
    event.detail.data.mob.map(function (mobData) {
        let mobModel = null;

        switch (mobData.name) {
            case 'human':
                mobModel = new Human();
                break;
            case 'animal':
                mobModel = new Animal();
                break;
            default:
                throw new Error('Model name: [' + mobData.name + ']. ' + error.model.unexpected);
                break;
        }

        // Current position, rotation and scale, read from Firebase.
        mobModel.position.set(mobData.position[0], mobData.position[1], mobData.position[2]);
        mobModel.rotation.set(mobData.rotation[0], mobData.rotation[1], mobData.rotation[2]);
        mobModel.scale.set(mobData.scale[0], mobData.scale[1], mobData.scale[2]);

        // Keep track of the original spawn position and rotation.
        // Only mob models need a spawn since the still models don't move.
        mobModel.userData.spawn.position = [mobData.position[0], mobData.position[1], mobData.position[2]];
        mobModel.userData.spawn.rotation = [mobData.rotation[0], mobData.rotation[1], mobData.rotation[2]]

        _this.mob.add(mobModel);
    });


    // Emit event the models are ready to be added to the scene.
    document.dispatchEvent(_this.ready);
};

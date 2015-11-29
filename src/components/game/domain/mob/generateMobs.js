import THREE from 'three';

import Human from './human';
import Animal from './animal';

import plotModelsOnGrid from '../plotModelsOnGrid';
import createGridPositions from '../createGridPositions';

// Generate all the mob models of a given domain as a single group.
module.exports = function generateMobs (input) {

    // Keep track of the domain instance scope.
    const _this = this;

    // Domain total width and height.
    const width = input && input.width || 1000;
    const height = input && input.height || 1000;

    // Available co-ordinates.
    const freeGridPositions = input && input.freeGridPositions;


    const human = new Human({
        firebaseUrl: _this.firebaseUrl + '/mob/human0'
    });

    const animal = new Animal({
        firebaseUrl: _this.firebaseUrl + '/mob/animal0'
    });

    // todo: generate mobs here.


    this.mob.name = 'mob-models';

    // Overwrite Firebase mob models with data that has just been randomly generated.
    this.set({
        endpoint: this.firebaseUrl + '/mob',
        payload: this.mob.children.map(function (child) {
            return { 
                name: child.name, 
                position: [child.position.x, child.position.y, child.position.z],
                rotation: [child.rotation.x, child.rotation.y, child.rotation.z],
                scale: [child.scale.x, child.scale.y, child.scale.z]  
            }
        })
    });
};

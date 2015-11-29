import THREE from 'three';

import Ground from './still/ground';
import Forest from './still/forest';
import CutTrunks from './still/cutTrunks';
import Rocks from './still/rocks';

import plotModelsOnGrid from './plotModelsOnGrid';
import createGridPositions from './createGridPositions';

// Generate all the still models of a given domain as a single group.
module.exports = function generate (input) {

    // Keep track of the domain instance scope.
    const _this = this;

    // Domain total width and height.
    const width = input && input.width || 1000;
    const height = input && input.height || 1000;

    // Available co-ordinates.
    const freeGridPositions = createGridPositions({
        width: width,
        height: height
    });

    // Ground.
    const ground = new Ground({
        width: width,
        height: height
    });
    this.still.add(ground);

    // Forest.
    const forest = new Forest({
        width: width,
        height: height,
        freeGridPositions: freeGridPositions,
        numberWillowsToPlot: 450,
        numberTreesToPlot: 450
    });
    for (let index = forest.group.children.length -1; index >= 0; index--) {
        _this.still.add(forest.group.children[index]);
    }

    // Cut trunks.
    const cutTrunks = new CutTrunks({
        width: width,
        height: height,
        freeGridPositions: forest.freeGridPositions // Place cut trunks where there is still room.
    });
    for (let index = cutTrunks.group.children.length - 1; index >= 0; index--) {
        _this.still.add(cutTrunks.group.children[index]);
    }

    // Rocks.
    const rocks = new Rocks({
        width: width,
        height: height,
        freeGridPositions: cutTrunks.freeGridPositions  // Place rocks where there is still room.
    });
    for (let index = rocks.group.children.length - 1; index >= 0; index--) {
        _this.still.add(rocks.group.children[index]);
    }

    this.still.name = 'still-models';

    // Overwrite Firebase still models with data that has just been randomly generated.
    this.set({
        endpoint: this.firebaseUrl + '/still',
        payload: this.still.children.map(function (child) {
            return { 
                name: child.name, 
                position: [child.position.x, child.position.y, child.position.z],
                rotation: [child.rotation.x, child.rotation.y, child.rotation.z],
                scale: [child.scale.x, child.scale.y, child.scale.z]  
            }
        })
    });
};

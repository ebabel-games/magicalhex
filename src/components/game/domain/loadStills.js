import THREE from 'three';

import Ground from './still/ground';
import Forest from './still/forest';
import CutTrunks from './still/cutTrunks';
import Rocks from './still/rocks';

import plotModelsOnGrid from './plotModelsOnGrid';
import createGridPositions from './createGridPositions';

// Load all the still models of a given domain as a single group.
module.exports = function loadStills (input) {

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
        freeGridPositions: freeGridPositions
    });
    this.still.add(forest.group);

    // Cut trunks.
    const cutTrunks = new CutTrunks({
        width: width,
        height: height,
        freeGridPositions: forest.freeGridPositions // Place cut trunks where there is still room.
    });
    this.still.add(cutTrunks.group);

    // Rocks.
    const rocks = new Rocks({
        width: width,
        height: height,
        freeGridPositions: cutTrunks.freeGridPositions  // Place rocks where there is still room.
    });
    this.still.add(rocks.group);
};

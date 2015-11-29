import THREE from 'three';

import Ground from './ground';
import Forest from './forest';
import CutTrunks from './cutTrunks';
import Rocks from './rocks';

import plotModelsOnGrid from '../plotModelsOnGrid';
import createGridPositions from '../createGridPositions';

// Generate all the still models of a given domain as a single group.
module.exports = function generateStills (input) {

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
        numberModelsToPlot: 300
    });
    forest.group.children.map(function (tree) {
        _this.still.add(tree);
    });

    // Willows: variation on the standard forest of basic trees.
    const willows = new Forest({
        width: width,
        height: height,

        // Willow.
        foliageImage: 'willow.png',
        trunkTop: 3,
        trunkBase: 8,
        trunkSides: 3,
        foliagePositionY: 95,
        foliageWidth: 128,
        foliageHeight: 128,

        freeGridPositions: forest.freeGridPositions,
        numberModelsToPlot: 300,
        treeName: 'willow'
    });
    willows.group.children.map(function (willow) {
        _this.still.add(willow);
    });

    // Cut trunks.
    const cutTrunks = new CutTrunks({
        width: width,
        height: height,
        freeGridPositions: willows.freeGridPositions // Place cut trunks where there is still room.
    });
    cutTrunks.group.children.map(function (cutTrunk) {
        _this.still.add(cutTrunk);
    });

    // Rocks.
    const rocks = new Rocks({
        width: width,
        height: height,
        freeGridPositions: cutTrunks.freeGridPositions  // Place rocks where there is still room.
    });
    rocks.group.children.map(function (rock) {
        _this.still.add(rock);
    });

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

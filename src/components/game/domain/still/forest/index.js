import THREE from 'three';

import Tree from '../tree';

import plotModelsOnGrid from '../../plotModelsOnGrid';

class Forest {
    constructor (input) {
        const width = input && input.width || 1000;
        const height = input && input.height || 1000;
        const freeGridPositions = input && input.freeGridPositions;

        const tree = new Tree(input);

        // Forest.
        const forest = plotModelsOnGrid({
            freeGridPositions: freeGridPositions,
            model: tree,
            numberModelsToPlot: 800,
            scale: { min: 0.16, max: 0.2 },
            rotate: true
        });

        forest.group.name = 'forest';

        return forest;
    }
}

module.exports = Forest;

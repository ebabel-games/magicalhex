import THREE from 'three';

import Rock from '../rock';

import plotModelsOnGrid from '../../plotModelsOnGrid';

class Rocks {
    constructor (input) {
        const width = input && input.width || 1000;
        const height = input && input.height || 1000;
        const freeGridPositions = input && input.freeGridPositions;

        const rock = new Rock(input);

        // Rocks.
        const rocks = plotModelsOnGrid({
            freeGridPositions: freeGridPositions,
            model: rock,
            numberModelsToPlot: 50,
            positionY: 0,
            rotate: true,
            scale: {
                min: 0.15,
                max: 0.3
            }
        });

        rocks.group.name = 'rocks';

        return rocks;
    }
}

module.exports = Rocks;

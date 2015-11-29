import THREE from 'three';

import Human from '../human';

import plotModelsOnGrid from '../../plotModelsOnGrid';

class Humans {
    constructor (input) {
        const width = input && input.width || 1000;
        const height = input && input.height || 1000;
        const freeGridPositions = input && input.freeGridPositions;

        const human = new Human(input);

        // Humans.
        const humans = plotModelsOnGrid({
            freeGridPositions: freeGridPositions,
            model: human,
            numberModelsToPlot: 9,
            positionY: 0,
            rotate: false,
            scale: false
        });

        humans.group.name = 'humans';

        return humans;
    }
}

module.exports = Humans;

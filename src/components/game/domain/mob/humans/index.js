import THREE from 'three';

import Human from '../human';

import plotModelsOnGrid from '../../plotModelsOnGrid';

class Humans {
    constructor (input) {
        const width = input && input.width || 1000;
        const height = input && input.height || 1000;
        const freeGridPositions = input && input.freeGridPositions;
        const numberModelsToPlot = input && input.numberModelsToPlot || 9;

        // Humans.
        const humans = plotModelsOnGrid({
            freeGridPositions: freeGridPositions,
            isMob: true,
            mobClass: Human,
            numberModelsToPlot: numberModelsToPlot,
            positionY: -0.8,
            rotate: true,
            scale: false
        });

        humans.group.name = 'humans';

        return humans;
    }
}

module.exports = Humans;



import Animal from '../animal';

import plotModelsOnGrid from '../../plotModelsOnGrid';

class Animals {
    constructor (input) {
        const width = input && input.width || 1000;
        const height = input && input.height || 1000;
        const freeGridPositions = input && input.freeGridPositions;
        const numberModelsToPlot = input && input.numberModelsToPlot || 9;

        // Animals.
        const animals = plotModelsOnGrid({
            freeGridPositions: freeGridPositions,
            isMob: true,
            mobClass: Animal,
            numberModelsToPlot: numberModelsToPlot,
            positionY: 0,
            rotate: true,
            scale: false
        });

        animals.group.name = 'animals';

        return animals;
    }
}

module.exports = Animals;



import Tree from '../tree';
import Willow from '../tree/willow';

import plotModelsOnGrid from '../../plotModelsOnGrid';

class Forest {
    constructor (input) {
        const width = input && input.width || 1000;
        const height = input && input.height || 1000;
        const freeGridPositions = input && input.freeGridPositions;
        const numberTreesToPlot = input && input.numberTreesToPlot || 20;
        const numberWillowsToPlot = input && input.numberWillowsToPlot || 20;

        const tree = new Tree(input);
        const willow = new Willow(input);

        // Standard trees.
        const forest = plotModelsOnGrid({
            freeGridPositions: freeGridPositions,
            model: tree,
            numberModelsToPlot: numberTreesToPlot,
            scale: { min: 0.25, max: 0.3 },
            rotate: true
        });

        // Willows.
        const willows = plotModelsOnGrid({
            freeGridPositions: forest.freeGridPositions,
            model: willow,
            numberModelsToPlot: numberWillowsToPlot,
            scale: { min: 0.2, max: 0.35 },
            rotate: true
        });

        // Merge the willows into the first forest of standard trees.
        // Note: add in reverse order because as the forest grows, 
        // the willows group of children shrinks.
        for (let index = willows.group.children.length -1; index >= 0; index--) {
            forest.group.add(willows.group.children[index]);
        }

        forest.group.name = 'forest';

        return forest;
    }
}

module.exports = Forest;

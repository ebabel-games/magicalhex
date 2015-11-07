import testCube from './test-cube/test-cube';
import monkey from './monkey/monkey';

// Initialize the mobs to load.
const initMobs = function initMobs (input) {

    // The testCube is a test mob used during development.
    testCube(input);

    // The monkey is also a test mob used during development.
    monkey(input);

    // Return the mob unique names that will be rendered.
    return ['test-cube', 'monkey'];
}

module.exports = initMobs;

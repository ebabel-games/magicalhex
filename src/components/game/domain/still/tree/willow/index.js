import THREE from 'three';

import Tree from '../index';

class Willow extends Tree {
    constructor (input) {
        return super({
            treeName: 'willow',
            foliageImage: 'willow.png',
            trunkTop: 3,
            trunkBase: 8,
            trunkSides: 3,
            foliagePositionY: 95,
            foliageWidth: 128,
            foliageHeight: 128
        });
    }
}

module.exports = Willow;

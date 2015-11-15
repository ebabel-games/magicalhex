import THREE from 'three';

import Mob from '../mob';
import build from './build';

class Human extends Mob {

    constructor (input) {

        input.mesh = build(input);

        // Human default life in case there's no input.
        input.life = input.life || 3;

        super(input);

        return this;
    }

}

module.exports = Human;

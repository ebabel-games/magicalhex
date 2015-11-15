import THREE from 'three';

import Mob from '../mob';
import build from './build';

class Animal extends Mob {

    constructor (input) {

        input.mesh = build(input);

        input.life = input.life || 2;

        super(input);

        return this;
    }

}

module.exports = Animal;

import THREE from 'three';

import loadModel from '../../loadModel';
import heartbeat from './heartbeat';
import takeDamage from '../../takeDamage';

import Sprite from '../../sprite';

class Human extends Sprite {
    constructor (input) {
        super(input);

    }
}

module.exports = Human;

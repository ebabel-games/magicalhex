import THREE from 'three';

import Mob from '../mob';
import build from './build';

class Human extends Mob {

    constructor (input) {

        super(input);

        const newMesh = build(input);

        newMesh.userData = this.mesh.userData;

        this.mesh = newMesh;

        this.mesh.life = input.life;

        return this;
    }

}

module.exports = Human;

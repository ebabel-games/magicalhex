import THREE from 'three';

import Mob from '../mob';
import build from './build';

class Human extends Mob {

    constructor (input) {

        super(input);

        const newMesh = build(input);

        // The new mesh needs to inherit from the Mob's mesh.
        newMesh.userData = this.mesh.userData;
        newMesh.takeDamage = this.mesh.takeDamage;
        newMesh.heartbeat = this.mesh.heartbeat;

        this.mesh = newMesh;

        this.mesh.life = input.life;

        return this;
    }

}

module.exports = Human;

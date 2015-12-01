import THREE from 'three';

import Mob from '../index';

import randomName from '../randomName';

class Human extends Mob {
    constructor (input) {
        super(input);

        const _this = this;

        const material = new THREE.MeshLambertMaterial({ color: 0xfeb186, fog: true, transparent: true, opacity: 1 });

        const head = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 8), material);
        head.position.set(0, 6.5, 0);
        head.name = 'head';

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.75, 0.75, 8), material);
        neck.position.set(0, 5.25, 0);
        neck.name = 'neck';

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 0.2, 4, 8), material);
        trunk.position.set(0, 2.875, 0);
        trunk.name = 'trunk';

        // Human.
        this.group.add(head);
        this.group.add(neck);
        this.group.add(trunk);

        this.group.name = input && input.humanName || 'human';

        this.group.userData.targetName = randomName();
        this.group.userData.maxLife = 3;
        this.group.userData.life = 3;

        // Actions to run in Render loop.
        this.group.userData.actions.push(
            function die() {
                if (_this.group.userData.life === 0) {
                    _this.group.rotation.x = 90 * Math.PI / 180;
                    _this.group.position.y = 1;
                }
            }
        );

        return this.group;
    }
}

module.exports = Human;

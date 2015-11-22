import THREE from 'three';
import Firebase from 'firebase';

import KeyboardControls from '../keyboardControls';

import Mob from '../mob';

import render from '../render';

// Get all mobs in current domain.
module.exports = function loadMobs (input) {

    const _this = this;
    const ref = new Firebase(this.mesh.userData.firebaseUrl + '/mob');

    ref.once('value', function getMobs (snapshot) {
        const mobs = snapshot.val();
        let mob;
        let mobInstance;

        _this.mob = [];

        _this.models = new THREE.Group();

        Object.keys(mobs).map(function (value, index) {
            mob = mobs[value];

            mobInstance = new Mob({
                firebaseUrl: mob.userData.firebaseUrl,
                name: mob.name,
                targetName: mob.userData.targetName,
                race: mob.userData.race,
                position: mob.position,
                rotation: mob.rotation,
                scale: mob.scale,
                life: mob.userData.life
            });

            _this.mob.push(mobInstance);

            _this.models.add(mobInstance.mesh);
        });

        // Add all mobs to the scene in one group.
        input.scene.add(_this.models);

        _this.mouseCoordinates = { x: null, y: null };

        // Listen for attempts to target a mob.
        const clickEvent = new CustomEvent('mousedown-event', 
            { 
                detail: {
                    camera: input.camera,
                    scene: input.scene,
                    renderer: input.renderer,
                    mob: _this.mob.map(function (_mob) { return _mob.mesh }),
                    raycaster: input.raycaster,
                    mouseCoordinates: _this.mouseCoordinates
                }
            });

        document.addEventListener('mousedown', function onMouseDown (e) {
            _this.mouseCoordinates.x = e.clientX;
            _this.mouseCoordinates.y = e.clientY;

            document.dispatchEvent(clickEvent);
        }, true);

        // Render the scene
        // Note: render is called from here because only now are the mobs loaded.
        render({
            renderer: input.renderer,
            scene: input.scene,
            camera: input.camera,
            keyboardControls: new KeyboardControls({ object: input.camera }),
            mob: _this.mob
        });

    });

};

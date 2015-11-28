import THREE from 'three';
import Firebase from 'firebase';

import KeyboardControls from '../keyboardControls';

import Mob from './mob';

import render from '../render';

// Load all the mobs of a given domain as a single group.
module.exports = function loadMobs (input) {

    // Keep track of the domain instance scope.
    const _this = this;

    const ref = new Firebase(this.firebaseUrl + '/mob');

    ref.once('value', function getMobs (snapshot) {
        const mobs = snapshot.val();
        let mob;
        let mobInstance;

        if (mobs) {
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

                _this.mob.add(mobInstance.mesh);
            });
        }

        _this.mouseCoordinates = { x: null, y: null };

        // Create an event that passes detail data when the mouse clicks on something.
        const clickEvent = new CustomEvent('mousedown-event', 
            { 
                detail: {
                    camera: input.camera,
                    scene: input.scene,
                    renderer: input.renderer,
                    mob: _this.mob,
                    raycaster: input.raycaster,
                    mouseCoordinates: _this.mouseCoordinates
                }
            });

        // Listen for a mouse click event and broadcasts the custom event clickEvent.
        document.addEventListener('mousedown', function onMouseDown (e) {
            _this.mouseCoordinates.x = e.clientX;
            _this.mouseCoordinates.y = e.clientY;

            // Broadcast the mouse click event.
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

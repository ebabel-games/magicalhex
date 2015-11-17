import THREE from 'three';
import Firebase from 'firebase';

import KeyboardControls from '../keyboardControls';

import Model from '../model';
import Mob from '../mob';

import render from '../render';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        this.mesh.name = input.name || 'terrain';

        const _this = this;

        // Get all mobs in current domain.
        const ref = new Firebase(this.mesh.userData.firebaseUrl + '/mob');
        ref.once('value', function getMobs (snapshot) {
            const mobs = snapshot.val();
            let mob;
            let mobInstance;

            _this.mob = [];

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
                })

                _this.mob.push(mobInstance);

                input.scene.add(mobInstance.mesh);
            });

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

            // Render the scene.
            render({
                renderer: input.renderer,
                scene: input.scene,
                camera: input.camera,
                keyboardControls: new KeyboardControls({ object: input.camera }),
                mob: _this.mob,

                // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
                callback: function callback (input) {
                    const scene = input && input.scene;

                    if (!scene) {
                        throw new Error(error.input.required);
                    }

                    // Every tick, run through all the mobs in the scene.
                    if (input.mob) {
                        input.mob.map(function (mob) {

                            if (mob.mesh.userData && mob.mesh.userData.firebaseUrl) {
                                const ref = new Firebase(mob.mesh.userData.firebaseUrl);
                            }

                            // If the mob has a hearbeat, run it now.
                            if (mob.mesh.heartbeat) {
                                mob.mesh.heartbeat(mob.mesh);
                            }
                        });
                    }
                }
            });




        });

        return this;        
    }

}

module.exports = Domain;

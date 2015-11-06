import THREE from 'three';

import loadModel from './loadModel/loadModel';
import InitScene from './initScene/initScene';
import Render from './render/render';
import error from '../shared/errorMessages';
import './game.css';

// Main game module.
const game = function game() {
    const scene = new THREE.Scene();
    const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    const light = new THREE.AmbientLight(0xffffff);
    const camera = InitScene({
        scene: scene,
        renderer: renderer,
        light: light,
        camera: {
            type: 'PerspectiveCamera',
            angle: 45,
            aspectRatio: window.innerWidth / window.innerHeight,
            nearPlane: 1,
            farPlane: 500,
            position: {
                z: 15
            }
        }
    });

    loadModel({
        url: '/models/test-cube/test-cube.json',
        material: new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}),
        modelName: 'test-cube',
        scene: scene,
        firebaseEndpoint: 'https://enchantment.firebaseio.com/world/test-cube',
        userData: {
            life: 50,
            dead: false,
            corpses: [],
            // Start is a fallback, in case there is no data in Firebase.
            start: {
                x: 5,
                y: 30,
                z: -45
            },
            heartbeat: function (sprite) {
                if (!sprite) {
                    return; // Sprite hasn't been found yet, it has probably not finished loading.
                }

                if (sprite.userData.life > 0) {
                    // keep hitting the sprite as long as it's got some life.
                    sprite.userData.life += -0.1;
                }

                if (sprite.userData.life <= 0) {

                    // The sprite just died.
                    // todo: refactor this death to become a reusable event for more any sprite.
                    if (sprite.userData.dead === false) {
                        const corpse = {
                            location: sprite.getWorldPosition(),
                            deathDate: Date.now(),
                            equipment: []   // todo: list the equipment left on the corpse
                        };

                        sprite.userData.corpses.push(corpse);

                        console.log('test-cube died: ' + JSON.stringify(corpse));
                    }

                    // Confirm the sprite is now dead.
                    sprite.userData.dead = true;
                    return;
                }
                
                if (sprite.position.y > 0) {
                    // First vector: the spaceship slowly comes into view, losing altitude.
                    sprite.position.z += 0.05;
                    sprite.position.y += -0.1;
                } else {
                    // Second vector: the spaceship speeds away from field of camera.
                    sprite.position.z += 0.5;
                    sprite.rotation.x += 0.5;
                }

                if (sprite.position.z > 25) {
                    // Back to start position.
                    sprite.position.set(
                        sprite.userData.start.x,
                        sprite.userData.start.y,
                        sprite.userData.start.z
                    );
                }
            }
        }
    });

    // Render the scene.
    Render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: [ 'test-cube' ],
        // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
        callback: function callback (input) {
            const sprites = input && input.sprites;
            const scene = input && input.scene;

            if (!sprites) {
                throw new Error(error.input.required);
            }

            sprites.map(function (spriteName) {
                const sprite = scene.getObjectByName(spriteName)

                if (sprite && sprite.userData && sprite.userData.heartbeat) {
                    sprite.userData.heartbeat(sprite);
                }
            });
        }
    });
};

module.exports = game;

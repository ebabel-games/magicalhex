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
        firebaseEndpoint: 'https://enchantment.firebaseio.com/world/test-cube'
    });

    // Render the scene.
    Render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: [
            {
                name: 'test-cube',
                scene: scene,
                heartbeat: function (input) {
                    var name = input && input.name;
                    var scene = input && input.scene;
                    var sprite;

                    if (!name || !scene) {
                        throw new Error(error.input.required);
                    }

                    sprite = scene.getObjectByName(name);

                    if (!sprite) {
                        return; // Sprite hasn't been found yet, it has probably not finished loading.
                    }

                    // Only run code below this point once the sprite has been found in the scene.
                    
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
                        sprite.position.set(5, 30, -45); // back to start position.
                    }
                }
            }
        ],
        // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
        callback: function callback (input) {
            var sprites = input && input.sprites;

            if (!sprites) {
                throw new Error(error.input.required);
            }

            sprites.map(function (sprite) {
                if (sprite.heartbeat) {
                    sprite.heartbeat(sprite);
                }
            });
        }
    });
};

module.exports = game;

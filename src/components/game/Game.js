import THREE from 'three';

import InitScene from './initScene/initScene';
import Render from './render/render';
import error from '../shared/errorMessages';
import './game.css';

// Main game module.
var game = function game() {
    var scene = new THREE.Scene();
    var renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    var light = new THREE.AmbientLight(0xffffff);
    var camera = InitScene({
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

    var cube = new THREE.Mesh(
        new THREE.CubeGeometry(1, 1, 1),
        new THREE.MeshNormalMaterial()
    );
    cube.name = 'test-cube';
    cube.position.x = -5;
    cube.position.y = 20;
    cube.position.z = -50;
    scene.add(cube);

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
                        sprite.position.y += -0.05;
                    } else {
                        // Second vector: the spaceship speeds away from field of camera.
                        sprite.position.z += 1.2;
                    }

                    if (sprite.position.z > 25) {
                        sprite.position.set(-5, 20, -50); // back to start position.
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

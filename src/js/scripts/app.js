// Main app module.
(function (THREE) {
    'use strict';

    var scene = new THREE.Scene();
    var renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    var light = new THREE.AmbientLight(0xffffff);
    var camera = ebg.initScene({
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
                y: 30,
                z: 180
            }
        }
    });

    // Dummy spaceship.
    ebg.loadModel({
        path: '/models/spaceship.dae',
        name: 'spaceship',
        scene: scene,
        position: {
            x: -5,
            y: 150,
            z: -100
        }
    });

    // Render the scene.
    ebg.render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: [
            {
                name: 'spaceship',
                scene: scene,
                // The heartbeat of a sprite is run every tick of the main render.
                heartbeat: function (input) {
                    var name = input && input.name;
                    var scene = input && input.scene;
                    var sprite;

                    if (!name || !scene) {
                        throw new Error(ebg.err.input.required);
                    }

                    sprite = scene.getObjectByName(name);

                    if (!sprite) {
                        return; // Sprite hasn't been found yet, it has probably not finished loading.
                    }

                    // Only run code below this point once the sprite has been found in the scene.
                    
                    if (sprite.position.y > 0) {
                        sprite.position.z += 0.5;
                        sprite.position.y += -0.5;
                        sprite.rotation.y += 0.001;
                        sprite.rotation.x += 0.001;
                    } else {
                        sprite.position.z += 3;
                    }
                }
            }
        ],
        // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
        callback: function callback (input) {
            var sprites = input && input.sprites;

            if (!sprites) {
                throw new Error(ebg.err.input.required);
            }

            sprites.map(function (sprite) {
                if (sprite.heartbeat) {
                    sprite.heartbeat(sprite);
                }
            });
        }
    });
}(THREE));

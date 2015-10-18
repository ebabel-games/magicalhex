// Main app module.
(function (THREE) {
    'use strict';

    var scene = new THREE.Scene();
    var renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    var light = new THREE.AmbientLight(0x404040);
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
                z: 200
            }
        }
    });
    var controls = new THREE.OrbitControls(camera);
    controls.addEventListener('change', function() {
        ebg.render({
            renderer: renderer,
            scene: scene,
            camera: camera
        });
    });

    // // Static downloaded model: SS1.
    // ebg.loadModel({
    //     path: '/models/ss1/SS1.dae',
    //     name: 'ss1',
    //     scene: scene,
    //     position: {
    //         x: -120,
    //         y: 0,
    //         z: -50
    //     },
    //     scale: 5
    // });

    // // Static spaceship.
    // ebg.loadModel({
    //     path: '/models/spaceship/spaceship.dae',
    //     name: 'static-spaceship',
    //     scene: scene,
    //     position: {
    //         x: -100,
    //         y: 0,
    //         z: -50
    //     },
    //     scale: 10
    // });

    // Animated spaceship.
    ebg.loadModel({
        path: '/models/spaceship/spaceship.dae',
        name: 'animated-spaceship',
        scene: scene,
        position: {
            x: 0,
            y: 150,
            z: -100
        },
        scale: 1
    });

    // Render the scene.
    ebg.render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: [
            // {
            //     // This spaceship is no animated because the orbit controls are used to look at it.
            //     name: 'static-spaceship',
            //     scene: scene
            // },
            {
                name: 'animated-spaceship',
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

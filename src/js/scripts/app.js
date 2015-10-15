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
        camera: camera
    });

    // Dummy cube.
    var dummyCube = ebg.dummy.cube({
        size: 15,
        color: 0x45ec23
    });
    scene.add(dummyCube);

    // Render the scene.
    ebg.render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: {
            dummyCube: {
                sprite: dummyCube,
                action: function (sprite) {
                    sprite.rotation.y += 0.02;
                    sprite.rotation.x += 0.03;
                    sprite.rotation.z += 0.01;
                }
            }
        }
    });
}(THREE));

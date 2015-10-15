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
    var dummyCube = ebg.dummy.cube();
    scene.add(dummyCube);

    // Render the scene.
    ebg.render({
        renderer: renderer,
        scene: scene,
        camera: camera
    });
}(THREE));

// Main app module.
(function (THREE) {
    'use strict';

    ebg.scene = new THREE.Scene();
    ebg.renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    ebg.light = new THREE.AmbientLight(0xffffff);
    ebg.camera = null;

    ebg.initScene();

    // Dummy cube.
    var dummyCube = ebg.dummy.cube();
    ebg.scene.add(dummyCube);

    // Render the scene.
    ebg.render();
}(THREE));

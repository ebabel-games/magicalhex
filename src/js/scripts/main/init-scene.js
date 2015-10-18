// Initialize the scene and return a camera.
ebg.initScene = function initScene (input) {
    'use strict';

    var scene = input && input.scene;
    var renderer = input && input.renderer;
    var light = input && input.light;
    var camera = input && input.camera;
    var controls = input && input.controls;
    var output;
    var _controls;

    if (!scene || !renderer || !light || !camera || 
        !camera.type || !camera.aspectRatio || !camera.nearPlane || !camera.farPlane) {
        throw new Error(ebg.err.input.required);
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('webgl-container').appendChild(renderer.domElement);

    scene.add(light);

    output = new THREE[camera.type](
        camera.angle, 
        camera.aspectRatio, 
        camera.nearPlane, 
        camera.farPlane
    );

    output.position.set(
        camera.position && camera.position.x || 0,
        camera.position && camera.position.y || 0,
        camera.position && camera.position.z || 100
    );

    if (controls && controls.type && controls.listenFor && controls.callback) {
        _controls = new THREE[controls.type](output);
        _controls.addEventListener(controls.listenFor, controls.callback);
    }
    
    scene.add(output);

    return output;
};
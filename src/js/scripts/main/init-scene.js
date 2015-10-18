// Initialize the scene and return a camera.
ebg.initScene = function initScene (input) {
    'use strict';

    var scene = input && input.scene;
    var renderer = input && input.renderer;
    var light = input && input.light;
    var camera = input && input.camera;
    var output;

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

    output.position.x = camera.position && camera.position.x ? camera.position.x : 0;
    output.position.y = camera.position && camera.position.y ? camera.position.y : 0;
    output.position.z = camera.position && camera.position.z ? camera.position.z : 100;
    
    scene.add(output);

    return output;
};
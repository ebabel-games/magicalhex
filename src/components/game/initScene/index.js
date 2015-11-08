import THREE from 'three';

import error from '../../shared/errorMessages';

// Initialize the scene and return a camera.
var initScene = function initScene (input) {
    var scene = input && input.scene;
    var renderer = input && input.renderer;
    var lights = input && input.lights;
    var camera = input && input.camera;
    var output;

    if (!scene || !renderer || !lights || !camera || 
        !camera.type || !camera.aspectRatio || !camera.nearPlane || !camera.farPlane) {
        throw new Error(error.input.required);
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game').appendChild(renderer.domElement);

    lights.map(function addLight (toAdd) {
        if (toAdd.position) {
            toAdd.light.position.set(toAdd.position.x, toAdd.position.y, toAdd.position.z);
        }
        scene.add(toAdd.light);
    });

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
    
    scene.add(output);

    return output;
};

module.exports = initScene;

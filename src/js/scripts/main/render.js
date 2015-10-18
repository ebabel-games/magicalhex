// Render the scene and animate the sprites that have been passed in the input.
ebg.render = function render (input) {
    'use strict';

    var renderer = input && input.renderer;
    var scene = input && input.scene;
    var camera = input && input.camera;
    var callback = input && input.callback;

    if (!renderer || !scene || !camera) {
        throw new Error(ebg.err.input.required);
    }

    renderer.render(scene, camera);

    if (callback) {
        callback(input);
    }

    requestAnimationFrame(function() {
        ebg.render(input);
    });
};

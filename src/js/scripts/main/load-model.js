// Load a collada model and add it to the scene.
ebg.loadModel = function loadModel (input) {
    'use strict';

    var loader;
    var path = input && input.path;
    var name = input && input.name;
    var scene = input && input.scene;
    var position = input && input.position || { x: 0, y: 0, z: 0 };

    if (!path || !name || !scene) {
        throw new Error(ebg.err.input.required);
    }

    loader = new THREE.ColladaLoader();

    loader.load(
        // Model path.
        path,

        // Model is loaded.
        function (collada) {
            collada.scene.name = name;

            collada.scene.position.x = position.x;
            collada.scene.position.y = position.y;
            collada.scene.position.z = position.z;

            scene.add(collada.scene);
        },

        // Model loading in progress.
        function (xhr) {
            console.log([
                xhr.currentTarget.responseURL,
                ' ',
                (xhr.loaded / xhr.total * 100),
                '% loaded'].join(''));
        }
    );
};
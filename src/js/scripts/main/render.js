// Render the scene.
ebg.render = function render (input) {
    var renderer = input.renderer;
    var scene = input.scene;
    var camera = input.camera;

    renderer.render(scene, camera);

    requestAnimationFrame(function() {
        ebg.render(input);
    });
};

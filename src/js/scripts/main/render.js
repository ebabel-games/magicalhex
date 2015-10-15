// Render the scene.
ebg.render = function render (input) {
    var renderer = input.renderer;
    var scene = input.scene;
    var camera = input.camera;
    var sprites = input.sprites;

    renderer.render(scene, camera);

    if (sprites.dummyCube) {
        sprites.dummyCube.rotation.y += 0.01;
    }

    requestAnimationFrame(function() {
        ebg.render(input);
    });
};

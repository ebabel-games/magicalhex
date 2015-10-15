// Render the scene and animate the sprites that have been passed in the input.
ebg.render = function render (input) {
    var renderer = input.renderer;
    var scene = input.scene;
    var camera = input.camera;
    var sprites = input.sprites;

    renderer.render(scene, camera);

    if (sprites.dummyCube) {
        sprites.dummyCube.action(sprites.dummyCube.sprite);
    }

    requestAnimationFrame(function() {
        ebg.render(input);
    });
};

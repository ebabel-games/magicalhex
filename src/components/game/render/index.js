import error from '../../shared/errorMessages';

// Render the scene and move the player in it with keyboardControls.update().
const render = function render (input) {
    const renderer = input && input.renderer;
    const scene = input && input.scene;
    const camera = input && input.camera;
    const callback = input && input.callback;

    const inverseMaxFPS = input && input.inverseMaxFPS;
    let frameDelta = input && input.frameDelta;
    const clock = input && input.clock;
    const keyboardControls = input && input.keyboardControls;

    if (!renderer || !scene || !camera || !keyboardControls) {
        throw new Error(error.input.required);
    }

    frameDelta += clock.getDelta();

    while (frameDelta >= inverseMaxFPS) {
        keyboardControls.update();

        renderer.render(scene, camera);

        if (callback) {
            callback(input);
        }

        frameDelta -= inverseMaxFPS;
    }

    requestAnimationFrame(function() {
        render(input);
    });

    return this;
};

module.exports = render;

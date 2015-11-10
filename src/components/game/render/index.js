import error from '../../shared/errorMessages';

// Render the scene and move the player in it with keyboardControls.update().
const render = function render (input) {
    const renderer = input && input.renderer;
    const scene = input && input.scene;
    const camera = input && input.camera;
    const callback = input && input.callback;
    const keyboardControls = input && input.keyboardControls;

    if (!renderer || !scene || !camera || !keyboardControls) {
        throw new Error(error.input.required);
    }

    keyboardControls.update();

    renderer.render(scene, camera);

    if (callback) {
        callback(input);
    }

    requestAnimationFrame(function() {
        render(input);
    });

    return this;
};

module.exports = render;

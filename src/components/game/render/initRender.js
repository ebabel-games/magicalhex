import render from './index';
import KeyboardControls from '../keyboardControls';

module.exports = function initRender (input) {

    const _this = input && input.domain;

    _this.mouseCoordinates = { x: null, y: null };

    // Create an event that passes detail data when the mouse clicks on something.
    const clickEvent = new CustomEvent('mousedown-event', 
        { 
            detail: {
                camera: input.camera,
                scene: input.scene,
                renderer: input.renderer,
                mob: _this.mob,
                raycaster: input.raycaster,
                mouseCoordinates: _this.mouseCoordinates
            }
        });

    // Listen for a mouse click event and broadcasts the custom event clickEvent.
    document.addEventListener('mousedown', function onMouseDown (e) {
        _this.mouseCoordinates.x = e.clientX;
        _this.mouseCoordinates.y = e.clientY;

        // Broadcast the mouse click event.
        document.dispatchEvent(clickEvent);
    }, true);

    // Start the THREE.js clock.
    input.clock.start();

    // Render the scene
    // Note: render is called from here because only now are the mobs loaded.
    render({
        renderer: input.renderer,
        scene: input.scene,
        camera: input.camera,
        keyboardControls: new KeyboardControls({ object: input.camera }),
        mob: _this.mob,
        clock: input.clock
    });

};

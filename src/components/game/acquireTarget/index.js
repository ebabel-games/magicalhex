import THREE from 'three';


// Compute what the player has clicked on.
module.exports = function acquireTarget() {
    document.addEventListener('mousedown-event', function handleClickEvent (e) {
        const camera = e.detail.camera;
        const scene = e.detail.scene;
        const renderer = e.detail.renderer;
        const sprites = e.detail.sprites;
        const raycaster = e.detail.raycaster;
        const mouseCoordinates = e.detail.mouseCoordinates;
        const spriteModels = [];

        // todo: refactore sprites to already contain all the sprites instead of just sprite names,
        // that way the code doesn't need to find all the sprites on each targeting interaction.
        sprites.map(function (spriteName) {
            const sprite = scene.getObjectByName(spriteName);

            if (sprite) {
                spriteModels.push(sprite);
            }
        });

        const recursiveFlag = false;

        const _mouse = {
            x: (mouseCoordinates.x / renderer.domElement.width) * 2 - 1,
            y: - (mouseCoordinates.y / renderer.domElement.height) * 2 + 1
        };

        raycaster.setFromCamera(_mouse, camera);

        const intersects = raycaster.intersectObjects(spriteModels, recursiveFlag);

        if (intersects.length > 0) {
            const currentTarget = intersects[0].object;

            // todo: raise an event to update the current target.
        }
    }, true);
}();

import THREE from 'three';

// Compute what the player has clicked on.
module.exports = function acquireTarget() {
    document.addEventListener('mousedown-event', function handleClickEvent (e) {
        const camera = e.detail.camera;
        const scene = e.detail.scene;
        const renderer = e.detail.renderer;
        const mob = e.detail.mob;
        const raycaster = e.detail.raycaster;
        const mouseCoordinates = e.detail.mouseCoordinates;
        const recursiveFlag = true;
        const mouse = {
            x: (mouseCoordinates.x / renderer.domElement.width) * 2 - 1,
            y: - (mouseCoordinates.y / renderer.domElement.height) * 2 + 1
        };

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(mob, recursiveFlag);

        if (intersects.length > 0) {
            const currentTarget = intersects[0].object;

            const _event = new CustomEvent('change-target', 
                { 
                    'detail': {
                        'targetName': currentTarget.userData.targetName || currentTarget.parent.userData.targetName,
                        'life': currentTarget.userData.life || currentTarget.parent.userData.life,
                        'currentTarget': currentTarget.parent || currentTarget
                    }
                });

            document.dispatchEvent(_event);
        }
    }, true);
}();

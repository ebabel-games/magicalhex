import THREE from 'three';

// Compute what the player has clicked on.
module.exports = function acquireTarget() {
    document.addEventListener('mousedown-event', function handleClickEvent (event) {
        const camera = event.detail.camera;
        const scene = event.detail.scene;
        const sprites = event.detail.sprites;
        const spriteModels = [];

        // todo: refactore sprites to already contain all the sprites instead of just sprite names,
        // that way the code doesn't need to find all the sprites on each targeting interaction.
        sprites.map(function (spriteName) {
            const sprite = scene.getObjectByName(spriteName);

            if (sprite) {
                spriteModels.push(sprite);
            }
        });

        const projector = new THREE.Projector();
        const vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
        vector.unproject(camera);

        const raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        const intersects = raycaster.intersectObjects( spriteModels );

        if (intersects.length > 0) {
            console.log('Target is ' + JSON.stringify(intersects[0].object.userData));
        }
    }, true);
}();

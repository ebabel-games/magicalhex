module.exports = function populateFromInput (input) {
    // Mesh name
    if (this.mesh) {
        this.mesh.name = input.name || 'model';
    }

    // THREE.js position.
    if (input.position && this.mesh) {
        this.mesh.position.set(
            input.position.x || 0, 
            input.position.y || 0, 
            input.position.z || 0
        );
    }

    // THREEE.js rotation.
    if (input.rotation && this.mesh) {
        this.mesh.rotation.set(
            input.rotation.x || 0,
            input.rotation.y || 0,
            input.rotation.z || 0
        );
    }

    // THREE.js scale.
    if (input.scale && this.mesh) {
        this.mesh.scale.set(
            input.scale.x || 1,
            input.scale.y || 1,
            input.scale.z || 1
        );
    }
};

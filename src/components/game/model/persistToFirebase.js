import Firebase from 'firebase';

// Update the endpoint with the current data.
module.exports = function persistToFirebase() {
    const ref = new Firebase(this.mesh.userData.firebaseUrl);
    const data = this.mesh;

    ref.update({
        uuid: data.uuid,
        name: data.name,
        userData: data.userData,
        position: {
            x: data.position.x,
            y: data.position.y,
            z: data.position.z
        },
        rotation: {
            x: data.rotation.x,
            y: data.rotation.y,
            z: data.rotation.z
        },
        scale: {
            x: data.scale.x,
            y: data.scale.y,
            z: data.scale.z
        }
    });
};

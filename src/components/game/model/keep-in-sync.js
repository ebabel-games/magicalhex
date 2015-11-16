// Keep model in sync with Firebase.
// Data flows from Firebase to the model.
module.exports = function keepInSync() {
    const _this = this;

    // Register this mob to get synced to data when it changes on Firebase.
    function registerFirebase() {
        const ref = new Firebase(_this.mesh.userData.firebaseUrl);
        ref.on('value', callback);
    }

    // Update game's data in local object instances when data has been changed on Firebase.
    function callback (snapshot) {
        const data = snapshot.val();

        _this.mesh.userData = data.userData;
        _this.mesh.position.set(data.position.x, data.position.y, data.position.z);
        _this.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        _this.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
    }

    registerFirebase();
}

import fade from './fade';

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

        if (data && data.userData) {
            _this.mesh.userData = data.userData;
        }

        if (data && data.position && data.position.x != undefined && data.position.y != undefined && data.position.z != undefined) {
            _this.mesh.position.set(data.position.x, data.position.y, data.position.z);
        }

        if (data && data.rotation && data.rotation.x !=undefined && data.rotation.y != undefined && data.rotation.z != undefined ) {
            _this.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }

        if (data && data.scale && data.scale.x !=undefined && data.scale.y != undefined && data.scale.z != undefined ) {
            _this.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
        }

        if (data && data.userData && data.userData.opacity != undefined) {
            fade({
                model: _this, 
                opacity: data.userData.opacity
            });
        }
    }

    registerFirebase();
}

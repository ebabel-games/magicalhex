// Keep model in sync with Firebase.
// Data flows from Firebase to the model.
module.exports = function keepInSync() {
    const _this = this;

    // Update game's data in local object instances when data has been changed on Firebase.
    function callback (snapshot) {
        const data = snapshot.val();

        _this.data = data;
    }

    // Register this model to get synced to data when it changes on Firebase.
    const ref = new Firebase(_this.firebaseUrl);
    ref.on('value', callback);
}

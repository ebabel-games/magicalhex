import Firebase from 'firebase';

module.exports = function populateFromFirebase (input) {
    const ref = new Firebase(input.firebaseUrl);
    const _this = this;

    ref.once('value', function (snapshot) {
        const data = snapshot.val();

        // No data was found in Firebase, so use input data instead and create record in Firebase.
        if (data === null) {
            _this.populateFromInput(input);
            _this.persistToFirebase();

            return;
        }

        // Data has been found in Firebase so apply it to model.
        _this.mesh.uuid = data.uuid;
        _this.mesh.name = data.name;
        _this.mesh.userData = data.userData;
        _this.mesh.position.set(data.position.x, data.position.y, data.position.z);
        _this.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        _this.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);            
    });
};

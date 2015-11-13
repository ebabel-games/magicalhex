module.exports = function isAlive (model) {

    if (model.userData.life <= 0) {

        // The model just died.
        if (model.userData.dead === false) {

            // Make the model fall down.
            model.rotation.x = 90 * Math.PI / 180;

            const corpse = {
                location: model.getWorldPosition(),
                deathTimestamp: Date.now(),
                equipment: model.userData.equipment
            };

            // The model keeps track of his corpse(s).
            if (model.userData.corpses) {
                model.userData.corpses.push(corpse);
            }

            // The model has lost all the equipment he carried at the time of death and left it on the corpse.
            if (model.userData.equipment) {
                model.userData.equipment = [];
            }

            console.log(model.userData.targetName + ' died: ' + JSON.stringify(corpse) + ' and had been created at ' + model.userData.creation.timestamp);
        }

        // Confirm the model is now dead.
        model.userData.dead = true;

        model.opacity = 0.2;

        return false;
    }

    return true;
};

import d2r from '../degreesToRadians';
import fade from './fade';

module.exports = function isAlive (model) {

    if (model.userData.life <= 0) {

        // The model just died.
        if (model.userData.dead === false) {

            // Make the model fall down.
            model.rotation.set(d2r(90), 0, 0);

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

        // Fade the model to the minimum opacity.
        fade({
            model: model,
            opacity: 0.1
        })

        return false;
    }

    if (model.userData.life > 0) {
        model.userData.dead = false;
    }

    return true;
};

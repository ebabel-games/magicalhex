import Firebase from 'firebase';

import error from '../../shared/errorMessages';

// Model takes damage
// Note: single responsibility, this function needs to stay small. 
// Exceptions to taking damage can be handled elsewhere to keep the code scalable.
// Calling this function means the damage has to be taken.
module.exports = function takeDamage (input) {
    if (!input || !input.model) {
        throw new Error(error.input.required);
    }

    const model = input.model;
    const damage = input.damage;

    // Cannot take negative damages.
    if (model.userData.life <= 0) {
        return this;
    }

    let updatedLifePoints = model.userData.life - damage;

    if (updatedLifePoints < 0) {
        updatedLifePoints = 0;
    }

    const isDead = updatedLifePoints <= 0;

    // Update Firebase with the new Life points.
    model.update({
        endpoint: model.userData.firebaseUrl + '/userData',
        payload: {
            life: updatedLifePoints,
            dead: isDead
        }
    });

    return this;
}

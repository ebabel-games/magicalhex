import error from '../../shared/errorMessages';

// Sprite takes damage
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

    if (damage >= model.userData.life) {
        model.userData.life = 0;
        return this;
    }

    model.userData.life -= damage;

    return this;
}
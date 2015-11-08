import error from '../../shared/errorMessages';

// Sprite takes damage
// Note: single responsibility, this function needs to stay small. 
// Exceptions to taking damage can be handled elsewhere to keep the code scalable.
// Calling this function means the damage has to be taken.
module.exports = function takeDamage (input) {
    if (!input || !input.sprite) {
        throw new Error(error.input.required);
    }

    const sprite = input.sprite;
    const damage = input.damage;

    // Cannot take negative damages.
    if (sprite.userData.life <= 0) {
        return this;
    }

    if (damage >= sprite.userData.life) {
        sprite.userData.life = 0;
        return this;
    }

    sprite.userData.life -= damage;

    return this;
}
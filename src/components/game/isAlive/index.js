module.exports = function isAlive (sprite) {

    if (sprite.userData.life <= 0) {

        // The sprite just died.
        if (sprite.userData.dead === false) {
            const corpse = {
                location: sprite.getWorldPosition(),
                deathDate: Date.now(),
                equipment: sprite.userData.equipment
            };

            // The sprite keeps track of his corpse(s).
            sprite.userData.corpses.push(corpse);

            // The sprite has lost all the equipment he carried at the time of death and left it on the corpse.
            sprite.userData.equipment = [];

            console.log(sprite.name + ' died: ' + JSON.stringify(corpse));
        }

        // Confirm the sprite is now dead.
        sprite.userData.dead = true;

        return false;
    }

    return true;
};

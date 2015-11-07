// Custom business logic of a sprite.
const heartbeat = function heartbeat (sprite) {
    if (!sprite) {
        return; // Sprite hasn't been found yet, it has probably not finished loading.
    }

    if (sprite.userData.life > 0) {
        // keep hitting the sprite as long as it's got some life.
        sprite.userData.life += -0.1;
    }

    if (sprite.userData.life <= 0) {

        // The sprite just died.
        // todo: refactor this death to become a reusable event for any sprite.
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
        return;
    }
    
    if (sprite.position.y > 0) {
        // First vector: the spaceship slowly comes into view, losing altitude.
        sprite.position.z += 0.05;
        sprite.position.y += -0.1;
    } else {
        // Second vector: the spaceship speeds away from field of camera.
        sprite.position.z += 0.5;
        sprite.rotation.x += 0.5;
    }

    if (sprite.position.z > 25) {
        // Back to start position.
        sprite.position.set(
            sprite.userData.start.x,
            sprite.userData.start.y,
            sprite.userData.start.z
        );
    }
};

module.exports = heartbeat;

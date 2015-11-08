import isAlive from '../../isAlive';

// Custom business logic of a sprite.
const heartbeat = function heartbeat (sprite) {
    if (!sprite) {
        return; // Sprite hasn't been found yet, it has probably not finished loading.
    }

    // If the mob is not alive, stop the heartbeat here.
    const _isAlive = isAlive(sprite);
    if (!_isAlive) {
        return this;
    }
    
    if (sprite.position.y > 1.5) {
        // First vector: the sprite slowly comes into view, losing altitude.
        sprite.position.z += 0.05;
        sprite.position.y += -0.5;
    } else {
        // Second vector: the sprite speeds away from field of camera.
        sprite.position.z += 0.5;
        sprite.rotation.x += 0.1;
    }

    if (sprite.position.z > 25) {
        // Back to start position.
        sprite.position.set(
            sprite.userData.start.x,
            sprite.userData.start.y,
            sprite.userData.start.z
        );
    }

    return this;
};

module.exports = heartbeat;

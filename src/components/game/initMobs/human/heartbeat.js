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

    return this;
};

module.exports = heartbeat;

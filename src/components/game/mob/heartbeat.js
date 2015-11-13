import isAlive from './isAlive';

// Custom business logic of a model.
const heartbeat = function heartbeat (model) {
    if (!model) {
        return; // Model hasn't been loaded yet.
    }

    // If the mob is not alive, stop the heartbeat here.
    const _isAlive = isAlive(model);
    if (!_isAlive) {
        return this;
    }

    // Sample movement. Do not keep here.
    model.position.z -= 0.05;
    model.position.x += 0.05;
    if (model.position.x > 500 && model.position.z < -500) {
        model.position.x = -500;
        model.position.z = 500;
    }

    return this;
};

module.exports = heartbeat;
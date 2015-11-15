import fade from './fade';
import isAlive from './isAlive';

// Custom business logic of a model.
module.exports = function heartbeat (model) {
    if (!model) {
        return; // Model hasn't been loaded yet.
    }

    // If the mob is not alive, stop the heartbeat here.
    const _isAlive = isAlive(model);
    if (!_isAlive) {
        return this;
    }

    // Fade a model that has less life than when he was created.
    if (model.userData.life < model.userData.creation.userData.life) {
        fade({
            model: model, 
            opacity: model.userData.life / model.userData.creation.userData.life
        });
    }

    return this;
};

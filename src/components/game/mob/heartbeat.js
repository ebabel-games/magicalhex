import fade from './fade';

import error from '../../shared/errorMessages';

// Custom business logic of a model.
module.exports = function heartbeat (model) {
    if (!model) {
        throw new Error(error.model.load.failed);
    }

    fade({
        model: model, 
        opacity: model.userData.life / model.userData.creation.userData.life
    });

    return this;
};

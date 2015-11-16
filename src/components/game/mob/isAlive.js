import d2r from '../degreesToRadians';
import fade from './fade';

module.exports = function isAlive (model) {
    const payload = {
        dead: false
    };

    // Update Firebase with the new Life points.
    model.update({
        endpoint: model.userData.firebaseUrl + '/userData',
        payload: payload
    });

    // Return if mob is alive, i.e. opposite of dead.
    return !payload.dead;
};

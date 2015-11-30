import constants from '../../../shared/constants';

const max = constants.names.length;

module.exports = function randomName (numberOfNames) {

    const name = [];
    numberOfNames = numberOfNames || 1;

    for (let count = 0; count < numberOfNames; count++) {
        name.push(constants.names[Math.floor(Math.random() * max)]);
    }

    return name.join(' ');
};

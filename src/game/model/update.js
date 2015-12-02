import Firebase from 'firebase';

// Update Firebase data from what has happened in game.
module.exports = function update (input) {
    const ref = new Firebase(input.endpoint);
    ref.update(input.payload);
};

import Firebase from 'firebase';

// Overwrite Firebase data at a given endpoint.
module.exports = function set (input) {
    const ref = new Firebase(input.endpoint);
    ref.set(input.payload);
};

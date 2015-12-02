import Firebase from 'firebase';

import error from '../../shared/errorMessages';

module.exports = {
    get: function (input) {
        const ref = new Firebase('https://enchantment.firebaseio.com');
        const player = input.player;
        const callback = input.callback;

        ref.child('player/' + player.id + '/character/creation').once('value', function getCharacter (snapshot) {
            var character = snapshot.val();

            if (callback) {
                callback({
                    player: player,
                    character: character
                });
            }
        });
    }
};

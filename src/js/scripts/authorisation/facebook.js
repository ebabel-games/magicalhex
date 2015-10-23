// Facebook authorisation
(function facebookAuthorisation (Firebase) {
    'use strict';

    var ref = new Firebase('https://enchantment.firebaseio.com');
    var button = document.getElementById('facebook-login-button');

    button.addEventListener('click', function facebookLoginButton_onClick (event) { // jshint ignore:line

        button.disabled = 'disabled';

        // todo: show loading spinner.

        ref.authWithOAuthPopup('facebook', function (error, authData) {

            var player;

            // todo: hide loading spinner.

            button.disabled = '';

            if (error) {
                ref.child('error/authorisation').push({
                    code: error.code || ebg.err.error.code,
                    message: error.message || ebg.err.error.message,
                    dateLogged: new Date().toJSON()
                });

                // todo: display error message and give advice.

            } else {
                player = {
                    id: authData.facebook.id,
                    displayName: authData.facebook.displayName,
                    profileImageUrl: authData.facebook.profileImageURL,
                    firstName: authData.facebook.cachedUserProfile.first_name,
                    lastName: authData.facebook.cachedUserProfile.last_name,
                    timezone: authData.facebook.cachedUserProfile.timezone,
                    locale: authData.facebook.cachedUserProfile.locale,
                    gender: authData.facebook.cachedUserProfile.gender,
                    ageRange: authData.facebook.cachedUserProfile.age_range.min
                };

                ref.child('player/' + player.id).set(player);
                ref.child('login/' + player.id).push({
                    loginDate: new Date().toJSON()
                });

                document.getElementById('login').style.display = 'none';

                ebg.showCharacterCreation({
                    player: player
                });
            }
        });
    });

}(Firebase));

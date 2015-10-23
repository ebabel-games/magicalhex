// Facebook authorisation
(function facebookAuthorisation (Firebase) {
    'use strict';

    var ref = new Firebase('https://enchantment.firebaseio.com');
    var button = document.getElementById('facebook-login-button');

    button.addEventListener('click', function facebookLoginButton_onClick (event) { // jshint ignore:line

        button.disabled = 'disabled';

        // todo: show loading spinner.

        ref.authWithOAuthPopup('facebook', function (error, authData) {

            // todo: hide loading spinner.

            button.disabled = '';

            if (error) {
                ref.child('error/authorisation/facebook').push({
                    code: error.code || ebg.err.error.code,
                    message: error.message || ebg.err.error.message,
                    dateLogged: new Date().toJSON()
                });

                // todo: display error message and give advice.

            } else {
                ebg.player = {
                    id: authData.facebook.id,
                    loginDate: new Date().toJSON(),
                    displayName: authData.facebook.displayName,
                    profileImageUrl: authData.facebook.profileImageURL,
                    firstName: authData.facebook.cachedUserProfile.first_name,
                    lastName: authData.facebook.cachedUserProfile.last_name,
                    timezone: authData.facebook.cachedUserProfile.timezone,
                    locale: authData.facebook.cachedUserProfile.locale,
                    gender: authData.facebook.cachedUserProfile.gender,
                    ageRange: authData.facebook.cachedUserProfile.age_range.min
                };

                ref.child('user/facebook/' + ebg.player.id).push(ebg.player);

                document.getElementById('login').style.display = 'none';

                // todo: display name and profile image of logged in player.

            }
        });
    });

}(Firebase));

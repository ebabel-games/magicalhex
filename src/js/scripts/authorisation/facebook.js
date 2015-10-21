// Facebook authorisation
(function facebookAuthorisation (Firebase) {
    'use strict';

    var ref = new Firebase('https://enchantment.firebaseio.com');

    var button = document.getElementById('facebook-login-button');

    button.addEventListener('click', function (event) {
        console.log(event);

        ref.authWithOAuthPopup('facebook', function (error, authData) {
            if (error) {
                console.log('Login Failed!', error);
            } else {
                console.log('Authenticated successfully with payload:', authData);
            }
        });
    });

}(Firebase));

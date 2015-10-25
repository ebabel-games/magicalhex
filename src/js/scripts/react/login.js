(function (React, ReactDOM) {
    'use strict';

    var Login = React.createClass({
        getInitialState: function() {
            return {
                isHidden: false,
                disabled: ''
            };
        },
        render: function () {
            if (this.state.isHidden) {
                return null;
            }

            return React.createElement('div', {
                    id: 'login',
                    key: 'div'
                },
                React.createElement('p', {
                        key: 'p'
                    }, 
                    React.createElement('button', 
                        {
                            id: 'facebook-login-button',
                            onClick: this.handleClick,
                            key: 'button',
                            disabled: this.state.disabled
                        }, 
                        'Login to play'
                    )
                )
            );
        },
        handleClick: function() {
            var _this = this;

            // Always start by disabling the login button as soon as it's been clicked on,
            // before checking if the login has been succesful or not.
            this.setState({
                disabled: 'disabled'
            });

            // todo: show loading spinner.

            ebg.ref.authWithOAuthPopup('facebook', function (error, authData) {

                var player;

                // todo: hide loading spinner.

                if (error) {
                    ebg.ref.child('error/authorisation').push({
                        code: error.code || ebg.err.error.code,
                        message: error.message || ebg.err.error.message,
                        dateLogged: new Date().toJSON()
                    });

                    // todo: display error message and give advice.

                    _this.setState({
                        disabled: ''
                    });
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

                    ebg.ref.child('player/' + player.id).set(player);
                    ebg.ref.child('login/' + player.id).push({
                        loginDate: new Date().toJSON()
                    });

                    _this.setState({
                        isHidden: true
                    });

                    ebg.showCharacterCreation({
                        player: player
                    });
                }
            });
        }
    });

    var component = React.createElement(Login);
    ReactDOM.render(component, document.getElementById('game'));

}(React, ReactDOM));

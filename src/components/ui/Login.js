import React from 'react';
import Firebase from 'firebase';
import ReactFireMixin from 'reactfire';

import error from '../game/ErrorMessages';

var Login = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState: function() {
        return {
            isHidden: false,
            disabled: ''
        };
    },
    componentDidMount: function() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
    },
    render: function () {
        var _html;

        if (this.state.isHidden) {
            return null;
        }

        _html = 
        <div id='login'>
            <p>
                <button onClick={this.handleClick} 
                    disabled={this.state.disabled}>
                    Facebook Login
                </button>
            </p>
        </div>

        return _html;
    },
    handleClick: function (event) {
        var _this = this;

        // Always start by disabling the login button as soon as it's been clicked on,
        // before checking if the login has been succesful or not.
        this.setState({
            disabled: 'disabled',
            isHidden: false
        });

        // todo: show loading spinner.

        this.ref.authWithOAuthPopup('facebook', function (_error, authData) {
            var _event;
            var _player;

            // todo: hide loading spinner.

            if (_error) {
                _this.ref.child('error/authorisation').push({
                    code: _error.code || error.facebook.code,
                    message: _error.message || error.facebook.message,
                    dateLogged: new Date().toJSON()
                });

                // todo: display error message and give advice.

                _this.setState({
                    disabled: '',
                    isHidden: false
                });
            } else {
                _player = {
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

                _this.ref.child('player/' + _player.id).set(_player);
                _this.ref.child('login/' + _player.id).push({
                    loginDate: new Date().toJSON()
                });

                _this.setState({
                    disabled: '',
                    isHidden: true
                });

                _event = new CustomEvent('show-character-creation', 
                    { 'detail': _player });

                // Set the input data of the React CharacterCreation to player.
                document.dispatchEvent(_event);
            }
        });
    }
});

module.exports = Login;

import React from 'react';
import Firebase from 'firebase';

import character from '../../game/characterCreation';

import error from '../../shared/errorMessages';
import './login.css';

// Game.
import game from '../../game';

class Login extends React.Component {

    // constructor is replacing getInitialState.
    constructor (props) {
        super (props);

        this.state = {
            isHidden: props.isHidden,
            disabled: props.disabled
        };
    }

    componentDidMount() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
    }

    componentWillUnmount() {
        this.ref.off();
    }

    render() {
        if (this.state.isHidden) {
            return null;
        }

        // In handleClick.bind(this), the .bind(this) is required 
        // to expose 'this' from this component to the handleClick function.
        return (
            <div id='login'>
                <p>
                    <button onClick={this.handleClick.bind(this)} 
                        disabled={this.state.disabled}>
                        Play
                    </button>
                </p>
            </div>
        )
    }

    handleClick (event) {
        // Keep track of the main this object inside the callbacks of Firebase.
        var _this = this;

        // Always start by disabling the login button as soon as it's been clicked on,
        // before checking if the login has been succesful or not.
        this.setState({
            disabled: 'disabled',
            isHidden: false
        });

        // todo: show loading spinner.

        this.ref.authWithOAuthPopup('facebook', function (_error, authData) {
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

                _this.ref.child('player/' + _player.id + '/account').update(_player);
                _this.ref.child('player/' + _player.id + '/login').push({
                    loginDate: new Date().toJSON()
                });

                _this.setState({
                    disabled: '',
                    isHidden: true
                });

                // Get character of logged in player, if any.
                character.get({
                    player: _player,
                    callback: function (input) {
                        var player = input.player;
                        var character = input.character;

                        if (!character || parseInt(character.creationPointsLeft) > 0) {
                            // Only show the character creation if the player 
                            // doesn't have a character already or if the creation points have all been used.
                            var _event = new CustomEvent('show-character-creation', 
                                { 
                                    'detail': {
                                        'player': player,
                                        'character': character
                                    }
                                });

                            // Set the input data of the React CharacterCreation to player and character (if any).
                            document.dispatchEvent(_event);
                        } else {
                            game({
                                playerId: player.id,
                                character: character
                            });
                        }
                    }
                });
            }
        });
    }
}

// Validation rules for the properties of this component.
Login.propTypes = {
    isHidden: React.PropTypes.bool,
    disabled: React.PropTypes.string
};

// Default values of the properties if they haven't been set in the tag.
Login.defaultProps = {
    isHidden: false,
    disabled: ''
}

module.exports = Login;

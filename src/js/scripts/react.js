(function (React, ReactDOM) {
    var Login = React.createClass({
        getInitialState: function() {
            return {
                isHidden: false,
                disabled: ''
            };
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
        handleClick: function() {
            var _this = this;

            // Always start by disabling the login button as soon as it's been clicked on,
            // before checking if the login has been succesful or not.
            this.setState({
                disabled: 'disabled',
                isHidden: false
            });

            // todo: show loading spinner.

            ebg.ref.authWithOAuthPopup('facebook', function (error, authData) {
                var _event;
                var _player;

                // todo: hide loading spinner.

                if (error) {
                    ebg.ref.child('error/authorisation').push({
                        code: error.code || ebg.err.error.code,
                        message: error.message || ebg.err.error.message,
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

                    ebg.ref.child('player/' + _player.id).set(_player);
                    ebg.ref.child('login/' + _player.id).push({
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

    var CharacterCreation = React.createClass({
        show: function (event) {
            var _this = this;
            var _character;

            ebg.ref.child('character/' + event.detail.id).once('value', function getCharacter (snapshot) {
                _character = snapshot.val();

                _this.setState({
                    data: event.detail,
                    character: _character,
                    isHidden: false,
                    disabled: ''
                });
            });
        },
        getInitialState: function() {
            return {
                data: null,
                isHidden: true,
                disabled: ''
            };
        },
        componentDidMount: function() {
            document.addEventListener('show-character-creation', this.show, true);
        },
        render: function () {
            var _html;

            if (this.state.isHidden) {
                return null;
            }

            _html =
            <form action='#' id='character-creation'>
                <label>
                    <input id='character-name' placeholder='character name' defaultValue={this.state.character.name} />
                </label>
                <p>
                    <img src={this.state.data.profileImageUrl} title={this.state.data.displayName} id='profile-image' />
                    <span id='creation-points-left'><em className='points'>3</em> creation points left</span>
                </p>
                <label>
                    strength <span className='points'>{this.state.character.strength}</span>
                    <input id='character-strength' type='range' min='3' max='19' 
                        defaultValue={this.state.character.strength} />
                </label>
                <label>
                    dexterity <span className='points'>{this.state.character.dexterity}</span>
                    <input id='character-dexterity' type='range' min='3' max='19' 
                        defaultValue={this.state.character.dexterity} />
                </label>
                <label>
                    intelligence <span className='points'>{this.state.character.intelligence}</span>
                    <input id='character-intelligence' type='range' min='3' max='19' 
                        defaultValue={this.state.character.intelligence} />
                </label>
                <button id='create-character'>Create character</button>
            </form>

            return _html;
        }
    });

    var Main = React.createClass({
        render: function() {
            return (
                <div id='main-container'>
                    <Login />
                    <CharacterCreation />
                </div>
            );
        }
    });

    var component = React.createElement(Main);
    ReactDOM.render(component, document.getElementById('game'));

}(React, ReactDOM));

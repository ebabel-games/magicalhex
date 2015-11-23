import React from 'react';
import Firebase from 'firebase';

import game from '../../../../game';

import error from '../../../../shared/errorMessages';

class CreateCharacterButton extends React.Component {

    constructor (props) {
        super (props);

        this.state = {
            disabled: props.disabled
        };
    }

    componentDidMount() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
    }

    render() {
        return (
            <button onClick={this.handleClick.bind(this)} 
                disabled={this.state.disabled}>
                Play
            </button>
        )
    }

    handleClick (event) {
        var _this = this;

        // Disable the button as soon as it's clicked on.
        this.setState({
            disabled: 'disabled'
        });

        // todo: show loading spinner.

        var playerid = _this.props.playerid;
        var character;

        if (!playerid) {
            this.setState({
                disabled: ''
            });

            throw new Error(error.player.notFound);
        }

        // todo: refactor this so that the id of each control isn't used and this gets updated the React way.
        // todo: sanitize this input because it could easily be hacked.
        character = {
            creationPointsLeft: parseInt(document.getElementById('creation-points-left').innerHTML),
            name: document.getElementById('character-name').value,
            summoning: parseInt(document.getElementById('character-summoning').value),
            magic: parseInt(document.getElementById('character-magic').value),
            life: parseInt(document.getElementById('character-life').value)
        };

        this.ref.child('player/' + playerid + '/character/creation').set(character, function onComplete (err) {
            if (err) {
                _this.setState({
                    disabled: ''
                });

                throw new Error(error.character.creation.failed);
            }

            game({
                playerId: _this.props.playerid,
                character: character
            });

            var event = new CustomEvent('hide-character-creation');
            document.dispatchEvent(event);
        });
    }
}

// Validation rules for the properties of this component.
CreateCharacterButton.propTypes = {
    disabled: React.PropTypes.string
};

// Default values of the properties if they haven't been set in the tag.
CreateCharacterButton.defaultProps = {
    disabled: ''
}

module.exports = CreateCharacterButton;

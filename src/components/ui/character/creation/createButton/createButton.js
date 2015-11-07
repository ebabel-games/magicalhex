import React from 'react';
import Firebase from 'firebase';

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
                Create character
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
            throw new Error(error.player.notFound);
        }

        // todo: refactor this so that the id of each control isn't used and this gets updated the React way.
        // todo: sanitize this input because it could easily be hacked.
        character = {
            creationPointsLeft: document.getElementById('creation-points-left').innerHTML,
            name: document.getElementById('character-name').value,
            summoning: document.getElementById('character-summoning').value,
            magic: document.getElementById('character-magic').value,
            life: document.getElementById('character-life').value
        };

        this.ref.child('character/' + playerid).set(character, function onComplete (err) {
            if (err) {
                throw new Error(error.character.creation.failed);
            }

            // todo: set the character creation component state of hidden to true.
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

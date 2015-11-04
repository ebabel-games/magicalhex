import React from 'react';
import Firebase from 'firebase';

import CharacterSummoningInput from './summoningInput';
import CharacterMagicInput from './magicInput';
import CharacterLifeInput from './lifeInput';

import CreateCharacterButton from './createButton/createButton';
import CharacterNameInput from './nameInput/nameInput';
import ProfileImage from './profileImage/profileImage';
import CreationPointsLeft from './pointsLeft/pointsLeft';

import error from '../../../shared/errorMessages';
import './creation.css';

class Creation extends React.Component {

    constructor (props) {
        super (props);

        this.state = {
            data: props.data,
            isHidden: props.isHidden,
            disabled: props.disabled
        };
    }

    componentDidMount() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
        document.addEventListener('show-character-creation', this.show.bind(this), true);
    }

    render() {
        if (this.state.isHidden) {
            return null;
        }

        return (
            <form action='#' id='character-creation' onSubmit={this.handleSubmit.bind(this)}>

                <CharacterNameInput name={this.state.character.name} />

                <p>
                    <ProfileImage src={this.state.data.profileImageUrl} title={this.state.data.displayName} />
                    <CreationPointsLeft creationPointsLeft={this.state.character.creationPointsLeft} />
                </p>

                <CharacterLifeInput life={this.state.character.life} change={this.update.bind(this)} />
                <CharacterMagicInput magic={this.state.character.magic} change={this.update.bind(this)} />
                <CharacterSummoningInput summoning={this.state.character.summoning} change={this.update.bind(this)} />

                <CreateCharacterButton playerid={this.state.data.id} />

            </form>
        )
    }

    show (event) {
        var _this = this;
        var _character;

        this.ref.child('character/' + event.detail.id).once('value', function getCharacter (snapshot) {
            _character = snapshot.val();

            if (!_character) {
                _character = {
                    creationPointsLeft: 30,
                    summoning: 30,
                    magic: 30,
                    life: 30
                };
            }

            _this.setState({
                data: event.detail,
                character: _character,
                isHidden: false,
                disabled: ''
            });
        });
    }

    update (event) {
        var _skill = {
            name: event.currentTarget.id.substring(10).toLowerCase(),
            value: parseInt(event.currentTarget.value, 10)
        };

        // Make a deep copy rather than references to the same object, 
        // because I want to update with setState, it's bad practice 
        // to update the state directly without setState.
        // More about this: http://jsperf.com/cloning-an-object/2
        var _character = JSON.parse(JSON.stringify(this.state.character));

        var _creationPointsLeft = parseInt(_character.creationPointsLeft, 10);

        // May be a negative value.
        var _difference = parseInt(_character[_skill.name], 10) - _skill.value;

        var _hasEnoughPointsLeft = (_creationPointsLeft + _difference) >= 0;

        if (!_hasEnoughPointsLeft) {
            event.preventDefault();
            event.currentTarget.value = _character[_skill.name];
            console.warn(error.pointsLeft.notEnough);
            return;
        }

        _character[_skill.name] = _skill.value;
        _character.creationPointsLeft = _creationPointsLeft + _difference;

        this.setState({
            character: _character
        });
    }

    handleSubmit (event) {
        event.preventDefault();

        var _this = this;
    }

}

Creation.propTypes = {
    data: React.PropTypes.object,
    isHidden: React.PropTypes.bool,
    disabled: React.PropTypes.string
};

Creation.defaultProps = {
    data: null,
    isHidden: true,
    disabled: ''
}

module.exports = Creation;

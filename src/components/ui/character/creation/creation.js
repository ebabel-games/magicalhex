import React from 'react';
import Firebase from 'firebase';

import SkillInput from './skillInput/skillInput';
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
            player: props.player,
            character: props.character,
            isHidden: props.isHidden,
            disabled: props.disabled
        };
    }

    componentDidMount() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
        document.addEventListener('show-character-creation', this.show.bind(this), true);
    }

    componentWillUnmount() {
        this.ref.off();
    }

    render() {
        if (this.state.isHidden) {
            return null;
        }

        return (
            <form action='#' id='character-creation' onSubmit={this.handleSubmit.bind(this)}>

                <CharacterNameInput name={this.state.character.name} />

                <p>
                    <ProfileImage src={this.state.player.profileImageUrl} title={this.state.player.displayName} />
                    <CreationPointsLeft creationPointsLeft={this.state.character.creationPointsLeft} />
                </p>

                <SkillInput skill='life' score={this.state.character.life} change={this.update.bind(this)} />
                <SkillInput skill='magic' score={this.state.character.magic} change={this.update.bind(this)} />
                <SkillInput skill='summoning' score={this.state.character.summoning} change={this.update.bind(this)} />

                <CreateCharacterButton playerid={this.state.player.id} />

            </form>
        )
    }

    show (event) {
        var _this = this;
        var player = event.detail.player;
        var character = event.detail.character;

        if (!character) {
            character = {
                creationPointsLeft: 30,
                summoning: 30,
                magic: 30,
                life: 30
            };
        }

        _this.setState({
            player: event.detail.player,
            character: character,
            isHidden: false,
            disabled: ''
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
        var character = JSON.parse(JSON.stringify(this.state.character));

        var _creationPointsLeft = parseInt(character.creationPointsLeft, 10);

        // May be a negative value.
        var _difference = parseInt(character[_skill.name], 10) - _skill.value;

        var _hasEnoughPointsLeft = (_creationPointsLeft + _difference) >= 0;

        if (!_hasEnoughPointsLeft) {
            event.preventDefault();
            event.currentTarget.value = character[_skill.name];
            console.warn(error.pointsLeft.notEnough);
            return;
        }

        character[_skill.name] = _skill.value;
        character.creationPointsLeft = _creationPointsLeft + _difference;

        this.setState({
            character: character
        });
    }

    handleSubmit (event) {
        event.preventDefault();

        var _this = this;
    }

}

Creation.propTypes = {
    player: React.PropTypes.object,
    character: React.PropTypes.object,
    isHidden: React.PropTypes.bool,
    disabled: React.PropTypes.string
};

Creation.defaultProps = {
    player: null,
    character: null,
    isHidden: true,
    disabled: ''
}

module.exports = Creation;

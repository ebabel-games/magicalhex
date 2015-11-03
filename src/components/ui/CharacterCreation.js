var React = require('react');
var Firebase = require('firebase');
var ReactFireMixin = require('reactfire');

var CreateCharacterButton = require('./CreateCharacterButton');
var CharacterNameInput = require('./CharacterNameInput');
var ProfileImage = require('./ProfileImage');
var CreationPointsLeft = require('./CreationPointsLeft');
var CharacterSummoningInput = require('./CharacterSummoningInput');
var CharacterMagicInput = require('./CharacterMagicInput');
var CharacterLifeInput = require('./CharacterLifeInput');

var error = require('../game/ErrorMessages');

var CharacterCreation = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState: function() {
        return {
            data: null,
            isHidden: true,
            disabled: ''
        };
    },
    componentDidMount: function() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
        document.addEventListener('show-character-creation', this.show, true);
    },
    render: function () {
        var _html;

        if (this.state.isHidden) {
            return null;
        }

        _html =
        <form action='#' id='character-creation' onSubmit={this.handleSubmit}>
            <CharacterNameInput name={this.state.character.name} />
            <p>
                <ProfileImage src={this.state.data.profileImageUrl} title={this.state.data.displayName} />
                <CreationPointsLeft creationPointsLeft={this.state.character.creationPointsLeft} />
            </p>
            <CharacterLifeInput life={this.state.character.life} change={this.update} />
            <CharacterMagicInput magic={this.state.character.magic} change={this.update} />
            <CharacterSummoningInput summoning={this.state.character.summoning} change={this.update} />
            <CreateCharacterButton playerid={this.state.data.id} />
        </form>

        return _html;
    },
    show: function (event) {
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
    },
    update: function (event) {
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
    },
    handleSubmit: function (event) {
        event.preventDefault();
    }
});

module.exports = CharacterCreation;

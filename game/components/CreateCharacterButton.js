var React = require('react');
var Firebase = require('firebase');
var ReactFireMixin = require('reactfire');

var error = require('./error');

var CreateCharacterButton = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState: function() {
        return {
            disabled: ''
        };
    },
    componentDidMount: function() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
    },
    render: function() {
        return (
            <button onClick={this.handleClick} 
                disabled={this.state.disabled}>
                Create character
            </button>
        )
    },
    handleClick: function (event) {
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
            // todo: if err, show error, otherwise hide the character creation.
            console.log(err);
        });
    }
});

module.exports = CreateCharacterButton;

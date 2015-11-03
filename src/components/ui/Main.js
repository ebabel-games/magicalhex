// Third party dependencies.
var React = require('react');
var ReactDOM = require('react-dom');

// UI.
var Login = require('./Login');
var CharacterCreation = require('./character/Creation');

// Game.
var Game = require('../game/Game');

// Main component.
// todo: make this component the only code in this file. Move the game code somewhere else.
var Main = React.createClass({
    render: function() {
        return (
            <div id='ui'>
                <Login />
                <CharacterCreation />
            </div>
        )
    }
});

ReactDOM.render(<Main />, document.getElementById('game'));

Game();

// Third party dependencies.
import React from 'react';
import ReactDOM from 'react-dom';

// UI.
import Login from './Login';
import CharacterCreation from './character/Creation';

// Game.
import Game from '../game/Game';

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

// Third party dependencies.
import React from 'react';
import ReactDOM from 'react-dom';

// UI.
import Login from './login/login';
import CharacterCreation from './character/Creation';
import './ui.css';

// Game.
import Game from '../game/Game';

// UI component.
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

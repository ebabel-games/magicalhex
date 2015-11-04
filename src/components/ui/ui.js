// Third party dependencies.
import React from 'react';
import ReactDOM from 'react-dom';

// UI.
import Login from './login/login';
import Creation from './character/creation/creation';
import './ui.css';

// Game.
import Game from '../game/Game';

// UI main component.
class Main extends React.Component {
    render() {
        return (
            <div id='ui'>
                <Login />
                <Creation />
            </div>
        )
    }
}

ReactDOM.render(<Main />, document.getElementById('game'));

Game();

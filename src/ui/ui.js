// Third party dependencies.
import React from 'react';
import ReactDOM from 'react-dom';

// UI.
import Target from './target';
import Login from './login/login';
import Creation from './character/creation/creation';
import './ui.css';

// UI main component.
class Main extends React.Component {
    render() {
        return (
            <div id='ui'>
                <Target />
                <Login />
                <Creation />
            </div>
        )
    }
}

ReactDOM.render(<Main />, document.getElementById('game'));

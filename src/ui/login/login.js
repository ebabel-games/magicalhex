import React from 'react';
import Firebase from 'firebase';

import character from '../../game/characterCreation';

import error from '../../shared/errorMessages';
import './login.css';

// Game.
import game from '../../game';

class Login extends React.Component {

    // constructor is replacing getInitialState.
    constructor (props) {
        super (props);

        this.state = {
            isHidden: props.isHidden,
            disabled: props.disabled
        };
    }

    componentDidMount() {
        this.ref = new Firebase('https://enchantment.firebaseio.com');
    }

    componentWillUnmount() {
        this.ref.off();
    }

    render() {
        if (this.state.isHidden) {
            return null;
        }

        // In handleClick.bind(this), the .bind(this) is required 
        // to expose 'this' from this component to the handleClick function.
        return (
            <div id='login'>
                <p>
                    <button onClick={this.handleClick.bind(this)} 
                        disabled={this.state.disabled}>
                        Play
                    </button>
                </p>
            </div>
        )
    }

    handleClick (event) {
        game({
            playerId: '116388262054951',
            character: null
        });

        this.setState({
            isHidden: true,
        });
    }
}

// Validation rules for the properties of this component.
Login.propTypes = {
    isHidden: React.PropTypes.bool,
    disabled: React.PropTypes.string
};

// Default values of the properties if they haven't been set in the tag.
Login.defaultProps = {
    isHidden: false,
    disabled: ''
}

module.exports = Login;

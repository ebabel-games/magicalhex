import React from 'react';

// todo: CharacterSummoningInput, CharacterMagicInput and CharacterLifeInput are too similar not to be refactored into one function.
var CharacterSummoningInput = React.createClass({
    render: function() {
        return (
            <label>
                summoning <span className='points'>{this.props.summoning}</span>
                <input id='character-summoning' type='range' min='3' max='70' 
                    onChange={this.props.change} 
                    defaultValue={this.props.summoning} />
            </label>
        )
    }
});

module.exports = CharacterSummoningInput;

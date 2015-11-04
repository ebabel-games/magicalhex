import React from 'react';

class CharacterSummoningInput extends React.Component {
    render() {
        return (
            <label>
                summoning <span className='points'>{this.props.summoning}</span>
                <input id='character-summoning' type='range' min='3' max='70' 
                    onChange={this.props.change} 
                    defaultValue={this.props.summoning} />
            </label>
        )
    }
}

module.exports = CharacterSummoningInput;

import React from 'react';

class CharacterLifeInput extends React.Component {
    render() {
        return (
            <label>
                life <span className='points'>{this.props.life}</span>
                <input id='character-life' type='range' min='3' max='70' 
                    onChange={this.props.change} 
                    defaultValue={this.props.life} />
            </label>
        )
    }
}

module.exports = CharacterLifeInput;

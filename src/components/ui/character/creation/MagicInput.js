import React from 'react';

class CharacterMagicInput extends React.Component {
    render() {
        return (
            <label>
                magic <span className='points'>{this.props.magic}</span>
                <input id='character-magic' type='range' min='3' max='70' 
                    onChange={this.props.change} 
                    defaultValue={this.props.magic} />
            </label>
        )
    }
}

module.exports = CharacterMagicInput;

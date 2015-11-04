import React from 'react';

class CharacterNameInput extends React.Component {
    render() {
        return (
            <label>
                <input id='character-name' placeholder='character name' defaultValue={this.props.name} />
            </label>
        )
    }
}

module.exports = CharacterNameInput;

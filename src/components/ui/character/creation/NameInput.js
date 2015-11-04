import React from 'react';

var CharacterNameInput = React.createClass({
    render: function() {
        return (
            <label>
                <input id='character-name' placeholder='character name' defaultValue={this.props.name} />
            </label>
        )
    }
});

module.exports = CharacterNameInput;

var React = require('react');

var CharacterLifeInput = React.createClass({
    render: function() {
        return (
            <label>
                life <span className='points'>{this.props.life}</span>
                <input id='character-life' type='range' min='1' max='70' 
                    onChange={this.props.change} 
                    defaultValue={this.props.life} />
            </label>
        )
    }
});

module.exports = CharacterLifeInput;

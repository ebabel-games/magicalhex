import React from 'react';

class SkillInput extends React.Component {
    render() {
        return (
            <label>
                {this.props.skill} <span className='points'>{this.props.score}</span>
                <input id={'character-' + this.props.skill} type='range' min='3' max='70' 
                    onChange={this.props.change} 
                    defaultValue={this.props.score} />
            </label>
        )
    }
}

module.exports = SkillInput;

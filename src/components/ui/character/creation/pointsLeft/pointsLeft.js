import React from 'react';

import './pointsLeft.css';

class CreationPointsLeft extends React.Component {
    render() {
        return (
            <span>
                <em id='creation-points-left'>{this.props.creationPointsLeft}</em> creation points left
            </span>
        )
    }
}

module.exports = CreationPointsLeft;

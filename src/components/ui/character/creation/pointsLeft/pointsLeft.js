import React from 'react';

import './pointsLeft.css';

var CreationPointsLeft = React.createClass({
    render: function() {
        return (
            <span>
                <em id='creation-points-left'>{this.props.creationPointsLeft}</em> creation points left
            </span>
        )
    }
});

module.exports = CreationPointsLeft;

var React = require('react');

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

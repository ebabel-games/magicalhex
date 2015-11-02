var React = require('react');

var ProfileImage = React.createClass({
    render: function() {
        return (
            <img src={this.props.src} title={this.props.title} id='profile-image' />
        )
    }
});

module.exports = ProfileImage;

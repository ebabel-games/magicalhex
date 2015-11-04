import React from 'react';

import './profileImage.css';

class ProfileImage extends React.Component {
    render() {
        return (
            <img src={this.props.src} title={this.props.title} id='profile-image' />
        )
    }
}

module.exports = ProfileImage;

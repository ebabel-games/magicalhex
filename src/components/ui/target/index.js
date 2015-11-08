import React from 'react';

import './target.css';

class Target extends React.Component {

    constructor (props) {
        super (props);

        this.state = {
            targetName: props.targetName,
            life: props.life
        };
    }

    componentDidMount() {
        document.addEventListener('change-target', this.changeTarget.bind(this), true);
    }

    render() {
        return (
            <div id="target">
                <p>{this.state.targetName}</p>
                <p>{this.state.life}</p>
            </div>
        )
    }

    changeTarget (e) {
        this.setState({
            targetName: e.detail.targetName,
            life: e.detail.life
        });
    }
}

Target.propTypes = {
    targetName: React.PropTypes.string,
    life: React.PropTypes.number
};

Target.defaultProps = {
    targetName: 'no target',
    life: null
}

module.exports = Target;

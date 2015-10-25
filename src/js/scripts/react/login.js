(function (React, ReactDOM) {
    'use strict';

    var Login = React.createClass({
        render: function () {
            return React.createElement('div', {
                    id: 'login'
                },
                React.createElement('p', {}, 
                    React.createElement('button', {
                                    id: 'facebook-login-button'
                                }, 'Login to play')
                    )
                );
        }
    });

    var component = React.createElement(Login);
    ReactDOM.render(component, document.getElementById('game'));

}(React, ReactDOM));

(function (React, ReactDOM) {
    'use strict';

    var CharacterCreation = React.createClass({
        getInitialState: function() {
            return {
                isHidden: true,
                disabled: ''
            };
        },
        render: function () {
            if (this.state.isHidden) {
                return null;
            }

            return React.createElement('form', {
                    id: 'character-creation',
                    key: 'form',
                    action: '#'
                }
            );
        }
    });

    var component = React.createElement(CharacterCreation);
    ReactDOM.render(component, document.getElementById('game'));

}(React, ReactDOM));

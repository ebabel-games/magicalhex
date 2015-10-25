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
            var html;

            if (this.state.isHidden) {
                return null;
            }

            html =
            <form action='#' id='character-creation'>
            </form>

            return html;
        }
    });

    var component = React.createElement(CharacterCreation);
    ReactDOM.render(component, document.getElementById('game'));

}(React, ReactDOM));

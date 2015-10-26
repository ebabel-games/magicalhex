(function (React, ReactDOM) {
    var CharacterCreation = React.createClass({
        show: function (event) {
            var _this = this;

            _this.setState({
                data: event.detail,
                isHidden: false,
                disabled: ''
            });
        },
        getInitialState: function() {
            return {
                data: null,
                isHidden: true,
                disabled: ''
            };
        },
        render: function () {
            var _html;

            if (this.state.isHidden) {
                return null;
            }

            _html =
            <form action='#' id='character-creation'>
            </form>

            return _html;
        }
    });

    var component = React.createElement(CharacterCreation);
    ReactDOM.render(component, document.getElementById('game'), function() {
        document.addEventListener('show-character-creation', this.show, true);
    });


}(React, ReactDOM));

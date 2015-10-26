(function (React, ReactDOM) {
    var CharacterCreation = React.createClass({
        componentDidMount: function() {
            var _this = this;

            document.addEventListener('show-character-creation', 
                function (event) {
                    _this.setState({
                        data: event.detail,
                        isHidden: false,
                        disabled: ''
                    });
                }, 
            true);
        },
        getInitialState: function() {
            return {
                data: null,
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

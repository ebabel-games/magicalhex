(function (React) {

    var LoginButton = React.createClass({
        render: function() {
            return (
                <div id='login'>
                    <p>
                        <button id='facebook-login-button'>Play with Facebook</button>
                    </p>
                </div>
            )
        }
    });

    React.render(<LoginButton />, document.getElementById('game'));

}(React));

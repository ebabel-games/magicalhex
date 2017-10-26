var path = require('path');

module.exports = {
    entry: './src/ui/ui.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /(node_modules)/,
                loader: 'babel'
            },
            {
                test: /\.css$/, 
                loader: 'style!css'
            }
        ]
    }
};
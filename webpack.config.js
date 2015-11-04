var path = require('path');

module.exports = {
    entry: './src/components/ui/ui.js',
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
                loader: [
                    'style',
                    'css'
                ]
            }
        ]
    }
};
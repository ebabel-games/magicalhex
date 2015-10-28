module.exports = {
    'banner': {
        'message': '/* This file is generated with Grunt and should not be edited directly. */',
        'files': [
            './src/js/dependencies.js',
            './src/js/scripts.js',
            './src/css/default.css'
        ]
    },
    'dependencies': [
        './bower_components/firebase/firebase-debug.js',
        './bower_components/three.js/build/three.js',
        './bower_components/three.js/examples/js/loaders/ColladaLoader.js'
    ],
    'scripts': [
        './src/js/scripts/react.js',
        './src/js/scripts/game/*.js',
        './src/js/scripts/character-creation/*.js',
        './src/js/scripts/game.js'
    ],
    'jshint': {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        quotmark: 'single',
        globals: {
            Firebase: true,
            THREE: true,
            ebg: true,
            console: true,
            React: true,
            ReactDOM: true
        }
    }
};
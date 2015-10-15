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
        // Libraries managed with Bower.
        './bower_components/three.js/build/three.js',
        './bower_components/firebase/firebase-debug.js'
    ],
    'scripts': [
        './src/js/scripts/app.js',
        './src/js/scripts/**/*.js'
    ]
};
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
        './bower_components/underscore/underscore.js',
        './bower_components/stats.js/build/stats.min.js',
        './bower_components/raphael/raphael.js',
        './bower_components/three.js/build/three.js',
        './bower_components/firebase/firebase-debug.js'

        // Third party libraries downloaded manually because they are not managed by Bower.
    ],
    'scripts': [
        './src/js/scripts/app.js',
        './src/js/scripts/**/*.js'
    ]
};
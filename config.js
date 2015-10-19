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
        './bower_components/ammo.js/builds/ammo.js',
        './bower_components/howler.js/howler.js',
        './bower_components/Keypress/keypress.js',
        './bower_components/pepjs/dist/pep.js',
        './bower_components/three.js/build/three.js',
        './bower_components/three.js/examples/js/loaders/ColladaLoader.js'
    ],
    'scripts': [
        './src/js/scripts/main/*.js',
        './src/js/scripts/app.js'
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
        globals: {
            THREE: true,
            ebg: true,
            console: true
        }
    }
};
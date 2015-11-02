// Third party dependencies.
var React = require('react');
var ReactDOM = require('react-dom');

// Game.
var Login = require('./Login');
var CharacterCreation = require('./CharacterCreation');

// Main component.
// todo: make this component the only code in this file. Move the game code somewhere else.
var Main = React.createClass({
    render: function() {
        return (
            <div id='ui'>
                <Login />
                <CharacterCreation />
            </div>
        )
    }
});

ReactDOM.render(<Main />, document.getElementById('game'));








// todo: should ebg be refactored as a React module, or at least as a module?

var THREE = require('three');
var collada = require('three-loaders-collada')(THREE);
var error = require('./error');

var ebg = {};

// Initialize the scene and return a camera.
ebg.initScene = function initScene (input) {
    var scene = input && input.scene;
    var renderer = input && input.renderer;
    var light = input && input.light;
    var camera = input && input.camera;
    var output;

    if (!scene || !renderer || !light || !camera || 
        !camera.type || !camera.aspectRatio || !camera.nearPlane || !camera.farPlane) {
        throw new Error(error.input.required);
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game').appendChild(renderer.domElement);

    scene.add(light);

    output = new THREE[camera.type](
        camera.angle, 
        camera.aspectRatio, 
        camera.nearPlane, 
        camera.farPlane
    );

    output.position.set(
        camera.position && camera.position.x || 0,
        camera.position && camera.position.y || 0,
        camera.position && camera.position.z || 100
    );
    
    scene.add(output);

    return output;
};


// Load a collada model and add it to the scene.
ebg.loadModel = function loadModel (input) {
    var loader;
    var path = input && input.path;
    var name = input && input.name;
    var scene = input && input.scene;
    var position = input && input.position || { x: 0, y: 0, z: 0 };
    var rotation = input && input.rotation || { x: 0, y: 0, z: 0 };

    if (!path || !name || !scene) {
        throw new Error(error.input.required);
    }

    loader = new THREE.ColladaLoader();
    //loader.options.convertUpAxis = true;

    loader.load(
        // Model path.
        path,

        // Model is loaded.
        function loaded (collada) {
            var model = collada.scene;

            model.name = name;
            model.position.set(position.x || 0, position.y || 0, position.z || 0);
            model.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);

            scene.add(model);
        },

        // Model loading in progress.
        function loading (xhr) {
            console.log([
                (xhr.loaded / xhr.total * 100),
                '% loaded'].join(''));
        }
    );
};


// Render the scene and animate the sprites that have been passed in the input.
ebg.render = function render (input) {
    var renderer = input && input.renderer;
    var scene = input && input.scene;
    var camera = input && input.camera;
    var callback = input && input.callback;

    if (!renderer || !scene || !camera) {
        throw new Error(error.input.required);
    }

    renderer.render(scene, camera);

    if (callback) {
        callback(input);
    }

    requestAnimationFrame(function() {
        ebg.render(input);
    });
};


// Game module.
(function game (THREE) {
    var scene = new THREE.Scene();
    var renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    var light = new THREE.AmbientLight(0xffffff);
    var camera = ebg.initScene({
        scene: scene,
        renderer: renderer,
        light: light,
        camera: {
            type: 'PerspectiveCamera',
            angle: 45,
            aspectRatio: window.innerWidth / window.innerHeight,
            nearPlane: 1,
            farPlane: 500,
            position: {
                z: 15
            }
        }
    });

    // Static spaceship.
    ebg.loadModel({
        path: 'models/spaceship/spaceship.dae',
        name: 'hyper-spaceship',
        scene: scene,
        position: {
            x: -5,
            y: 20,
            z: -50
        },
        rotation: {
            x: 30
        }
    });

    // Animated spaceship.
    ebg.loadModel({
        path: 'models/spaceship/spaceship.dae',
        name: 'fast-spaceship',
        scene: scene,
        position: {
            x: 1.5,
            y: 20,
            z: -25
        },
        rotation: {
            x: 30
        }
    });

    // Animated spaceship.
    ebg.loadModel({
        path: 'models/spaceship/spaceship.dae',
        name: 'slow-spaceship',
        scene: scene,
        position: {
            x: -1,
            y: 20,
            z: -45
        },
        rotation: {
            x: 30
        }
    });

    // Render the scene.
    ebg.render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: [
            {
                name: 'hyper-spaceship',
                scene: scene,
                heartbeat: function (input) {
                    var name = input && input.name;
                    var scene = input && input.scene;
                    var sprite;

                    if (!name || !scene) {
                        throw new Error(error.input.required);
                    }

                    sprite = scene.getObjectByName(name);

                    if (!sprite) {
                        return; // Sprite hasn't been found yet, it has probably not finished loading.
                    }

                    // Only run code below this point once the sprite has been found in the scene.
                    
                    if (sprite.position.y > 0) {
                        // First vector: the spaceship slowly comes into view, losing altitude.
                        sprite.position.z += 0.05;
                        sprite.position.y += -0.05;
                    } else {
                        // Second vector: the spaceship speeds away from field of camera.
                        sprite.position.z += 1.2;
                    }

                    if (sprite.position.z > 25) {
                        sprite.position.set(-5, 20, -50); // back to start position.
                    }
                }
            },
            {
                name: 'fast-spaceship',
                scene: scene,
                // The heartbeat of a sprite is run every tick of the main render.
                heartbeat: function (input) {
                    var name = input && input.name;
                    var scene = input && input.scene;
                    var sprite;

                    if (!name || !scene) {
                        throw new Error(error.input.required);
                    }

                    sprite = scene.getObjectByName(name);

                    if (!sprite) {
                        return; // Sprite hasn't been found yet, it has probably not finished loading.
                    }

                    // Only run code below this point once the sprite has been found in the scene.
                    
                    if (sprite.position.y > 0) {
                        // First vector: the spaceship slowly comes into view, losing altitude.
                        sprite.position.z += 0.05;
                        sprite.position.y += -0.05;
                    } else {
                        // Second vector: the spaceship speeds away from field of camera.
                        sprite.position.z += 1;
                    }

                    if (sprite.position.z > 25) {
                        sprite.position.set(1.5, 20, -25); // back to start position.
                    }
                }
            },
            {
                name: 'slow-spaceship',
                scene: scene,
                // The heartbeat of a sprite is run every tick of the main render.
                heartbeat: function (input) {
                    var name = input && input.name;
                    var scene = input && input.scene;
                    var sprite;

                    if (!name || !scene) {
                        throw new Error(error.input.required);
                    }

                    sprite = scene.getObjectByName(name);

                    if (!sprite) {
                        return; // Sprite hasn't been found yet, it has probably not finished loading.
                    }

                    // Only run code below this point once the sprite has been found in the scene.
                    
                    if (sprite.position.y > -2) {
                        // First vector: the spaceship slowly comes into view, losing altitude.
                        sprite.position.z += 0.05;
                        sprite.position.y += -0.05;
                    } else {
                        // Second vector: the spaceship moves away from field of camera, slower than fast-spaceship.
                        sprite.position.z += 0.33;
                    }

                    if (sprite.position.z > 25) {
                        sprite.position.set(-1, 20, -45); // back to start position.
                    }
                }
            }
        ],
        // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
        callback: function callback (input) {
            var sprites = input && input.sprites;

            if (!sprites) {
                throw new Error(error.input.required);
            }

            sprites.map(function (sprite) {
                if (sprite.heartbeat) {
                    sprite.heartbeat(sprite);
                }
            });
        }
    });
}(THREE));




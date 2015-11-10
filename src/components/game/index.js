import THREE from 'three';

import axes from './axes';
import acquireTarget from './acquireTarget';
import initMobs from './initMobs';
import initScene from './initScene';
import render from './render';
import error from '../shared/errorMessages';
import './game.css';


// Main game module.
const game = function game() {
    // Objects to create only once in the game.
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.02);
    const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    const lights = [
        {
            light: new THREE.DirectionalLight(0xffcccc, 0.5),
            position: { x: 100, y: 100, z: 100 }
        },
        {
            light: new THREE.DirectionalLight(0x800020, 0.5),
            position: { x: -100, y: 100, z: -100 }
        }
    ];
    const raycaster = new THREE.Raycaster();
    const camera = initScene({
        scene: scene,
        renderer: renderer,
        lights: lights,
        camera: {
            type: 'PerspectiveCamera',
            angle: 45,
            aspectRatio: window.innerWidth / window.innerHeight,
            nearPlane: 1,
            farPlane: 200,
            position: {
                x: 0,
                y: 6,
                z: 0
            },
            rotation: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    });

    // Test: display world axes.
    axes({
        scene: scene,
        axesLength: 1000
    });

    const keyCodes = {
        // Move forward.
        'w': 87,

        // Strafe to the left.
        'q': 81,

        // Turn to the left.
        'a': 65,

        // Move backward.
        's': 83,

        // Turn to the right.
        'd': 68,

        // Strafe to the right.
        'e': 69,

        // Cast first memorized spell.
        '1': 49,

        // Escape: clear current target.
        'esc': 27
    };

    // Array of all mobs, players and the world environment since it can be modified by players.
    const sprites = [];

    // Initialize all the mobs and get an array of all their names.
    const mobs = initMobs({
        scene: scene
    });

    const mouseCoordinates = {
        x: null,
        y: null
    };

    let currentTarget = null;

    // Merge the mobs into the array of sprites that will be rendered.
    sprites.push(...mobs);

    // Render the scene.
    render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        sprites: sprites,
        // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
        callback: function callback (input) {
            const sprites = input && input.sprites;
            const scene = input && input.scene;

            if (!sprites) {
                throw new Error(error.input.required);
            }

            sprites.map(function (spriteName) {
                const sprite = scene.getObjectByName(spriteName);

                if (sprite && sprite.userData && sprite.userData.heartbeat) {
                    sprite.userData.heartbeat(sprite);
                }
            });
        }
    });

    // Listen for attempts to target a sprite.
    const clickEvent = new CustomEvent('mousedown-event', 
        { 
            'detail': {
                'camera': camera,
                'scene': scene,
                'renderer': renderer,
                'sprites': sprites,
                'raycaster': raycaster,
                'mouseCoordinates': mouseCoordinates
            }
        });
    document.addEventListener('mousedown', function (e) {
        mouseCoordinates.x = e.clientX;
        mouseCoordinates.y = e.clientY;

        document.dispatchEvent(clickEvent);
    }, true);

    // Listen for a change of target.
    document.addEventListener('change-target', function (e) {
        currentTarget = e.detail.currentTarget;
    }, true);

    // Listen for a key.
    document.addEventListener('keydown', function (e) {
        // Move forward.
        if (e.keyCode === keyCodes['w']) {
            camera.position.z -= 1;
        }

        // Move backwards.
        if (e.keyCode === keyCodes['s']) {
            camera.position.z += 1;
        }

        // Turn to the left.
        if (e.keyCode === keyCodes['a']) {
            camera.rotation.y += 0.1;
        }

        // Turn to the right.
        if (e.keyCode === keyCodes['d']) {
            camera.rotation.y -= 0.1;
        }

        // Strafe left.
        if (e.keyCode === keyCodes['q']) {
            camera.position.x -= 0.1;
        }

        // Strafe right.
        if (e.keyCode === keyCodes['e']) {
            camera.position.x += 0.1;
        }

        // Clear the current target.
        if (e.keyCode === keyCodes['esc']) {
            document.dispatchEvent(
                new CustomEvent('change-target', 
                { 
                    'detail': {
                        'targetName': 'no target',
                        'life': null,
                        'currentTarget': null
                    }
                })
            );
        }

        // The key [1] has been pressed, which fires damage on the current target (for now).
        if (currentTarget && e.keyCode === keyCodes['1']) {
            currentTarget.userData.takeDamage({
                sprite: currentTarget,
                damage: 1
            });
            document.dispatchEvent(
                new CustomEvent('change-target', 
                { 
                    'detail': {
                        'targetName': currentTarget.userData.targetName,
                        'life': currentTarget.userData.life,
                        'currentTarget': currentTarget
                    }
                })
            );
        }
    });


    return this;
};

module.exports = game;

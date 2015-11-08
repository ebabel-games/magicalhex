import THREE from 'three';

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
    const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    //const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    const lights = [
        {
            light: new THREE.DirectionalLight(0xffcccc),
            position: { x: 100, y: 100, z: 100 }
        },
        {
            light: new THREE.DirectionalLight(0x800020),
            position: { x: -100, y: -100, z: -100 }
        },
        {
            light: new THREE.AmbientLight(0x100000)
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
            farPlane: 500,
            position: {
                z: 15
            }
        }
    });



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



    return this;
};

module.exports = game;

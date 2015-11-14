import THREE from 'three';

import d2r from './degreesToRadians';
import axes from './axes';
import acquireTarget from './acquireTarget';
import initScene from './initScene';
import render from './render';

import KeyboardControls from './keyboardControls';

import Model from './model';
import Terrain from './terrain';
import Human from './human';
import Animal from './animal';

import error from '../shared/errorMessages';
import './game.css';

// Main game module.
module.exports = function game() {
    // Objects to create only once in the game.
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.02);

    const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    const lights = [
        { light: new THREE.DirectionalLight(0xffcccc, 0.5), position: { x: 10, y: 10, z: 10 } },
        { light: new THREE.DirectionalLight(0x800020, 0.5), position: { x: -10, y: 10, z: -10 } }
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
            position: { x: 0, y: 6, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    });
    const keyboardControls = new KeyboardControls({ object: camera });

    // Test: display world axes.
    axes({ scene: scene, axesLength: 1000 });

    // Current domain.
    // Note: this information is hard coded for now but it will come from 
    // the logged in player who keeps a record of his location, either 
    // where he was last player or if it's a new player, 
    // where he's just being created.
    const domain = {
        name: 'test-domain', // Each domain gets a randomly genereated internal name upon creation.
        position: {x: 0, y: 0, z: 0},   // The x and z matter here, since a domain y position is always 0.
    };

    // Collection of models that can be targeted and 
    // whose heartbeat will be run by the render callback.
    const models = [];

    // Terrain of current domain.
    const terrain = new Terrain({
        firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + domain.name + '/terrain',
        name: 'ground terrain',
        geometry: new THREE.PlaneGeometry(2000, 2000),
        material: new THREE.MeshLambertMaterial({ color: 0xadff60, fog: true }),
        rotation: { x: -90 * Math.PI / 180, y: 0, z: 0 }
    });
    scene.add(terrain.mesh);

    // Human: John.
    const john = new Human({
        firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + domain.name + '/mob/john',
        name: 'john',
        targetName: 'John',
        life: 3
    });
    scene.add(john.mesh);
    models.push(john.mesh);

    // Human: Sander.
    const sander = new Human({
        firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + domain.name + '/mob/sander',
        name: 'sander',
        targetName: 'Sander',
        life: 4
    });
    scene.add(sander.mesh);
    models.push(sander.mesh);

    const horse = new Animal({
        firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + domain.name + '/mob/jolly-jumper',
        name: 'jolly-jumper',
        targetName: 'Jolly Jumper',
        life: 1
    });
    horse.mesh.rotation.y = d2r(45);
    scene.add(horse.mesh);
    models.push(horse.mesh);

    const mouseCoordinates = { x: null, y: null };

    let currentTarget = null;

    // Render the scene.
    render({
        renderer: renderer,
        scene: scene,
        camera: camera,
        keyboardControls: keyboardControls,
        models: models,

        // The callback is run every tick of the main render. It co-ordinates running all sprite heartbeats.
        callback: function callback (input) {
            const models = input && input.models;
            const scene = input && input.scene;

            if (!scene) {
                throw new Error(error.input.required);
            }

            // Every tick, run through all the models in the scene.
            if (models) {
                models.map(function (model) {

                    // If the model has a hearbeat, run it now.
                    if (model && model.heartbeat) {
                        model.heartbeat(model);
                    }
                });
            }
        }
    });

    const keyCodes = {
        // Cast first memorized spell.
        '1': 49,

        // Escape: clear current target.
        'esc': 27
    };

    // Listen for attempts to target a sprite.
    const clickEvent = new CustomEvent('mousedown-event', 
        { 
            detail: {
                camera: camera,
                scene: scene,
                renderer: renderer,
                models: models,
                raycaster: raycaster,
                mouseCoordinates: mouseCoordinates
            }
        });
    document.addEventListener('mousedown', function onMouseDown (e) {
        mouseCoordinates.x = e.clientX;
        mouseCoordinates.y = e.clientY;

        document.dispatchEvent(clickEvent);
    }, true);

    // Listen for a change of target.
    document.addEventListener('change-target', function onChangeTarget (e) {
        currentTarget = e.detail.currentTarget;
    }, true);

    // Listen for a key.
    document.addEventListener('keydown', function onKeyDown (e) {
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

        // The key [1] has been pressed, which fires damage on the current target.
        if (currentTarget && e.keyCode === keyCodes['1']) {
            currentTarget.takeDamage({
                model: currentTarget,
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

    // Prevent selection on the page
    document.onselectstart = function onSelectStart() { return false; }

    return this;
};

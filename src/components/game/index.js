import THREE from 'three';
import Firebase from 'firebase';

import d2r from './degreesToRadians';
import axes from './axes';
import acquireTarget from './acquireTarget';
import initScene from './initScene';

import Model from './model';
import Domain from './domain';
import Mob from './mob';

import error from '../shared/errorMessages';
import './game.css';

// Main game module.
module.exports = function game (playerId) {
    // Objects to create only once in the game.
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.02);

    const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    const lights = [
        { light: new THREE.DirectionalLight(0xffcccc, 0.4), position: { x: 10, y: 10, z: 10 } },
        { light: new THREE.DirectionalLight(0x800020, 0.6), position: { x: -10, y: 10, z: -10 } }
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
            farPlane: 150,
            position: { x: 0, y: 6, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    });

    // Test: display world axes.
    axes({ scene: scene, axesLength: 500 });

    // Current domain.
    // Note: this information is hard coded for now but it will come from 
    // the logged in player who keeps a record of his location, either 
    // where he was last player or if it's a new player, 
    // where he's just been created.
    const domain = new Domain({
        firebaseUrl: 'https://enchantment.firebaseio.com/domain/test-domain',
        name: 'test-domain', // Each domain will get a randomly genereated internal name upon creation.
        geometry: new THREE.PlaneGeometry(1000, 1000),
        material: new THREE.MeshLambertMaterial({ color: 0xadff60, fog: true }),
        camera: camera,
        scene: scene,
        renderer: renderer,
        raycaster: raycaster
    });
    scene.add(domain.mesh);

    let currentTarget = null;

    const keyCodes = {
        // Cast first memorized spell.
        '1': 49,

        // Escape: clear current target.
        'esc': 27
    };

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

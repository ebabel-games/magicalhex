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
// Note: the unit is in inches. The eyes of the player are 6 inches from the ground.
module.exports = function game (input) {
    const playerId = input && input.playerId;
    let character = input && input.character;

    // Objects to create only once in the game.
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9db3b5, 0.005);

    const renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    const lights = [
        { light:  new THREE.HemisphereLight(0xffffcc, 0x080820, 0.2) },
        { light: new THREE.DirectionalLight(0xccff20, 0.4), position: { x: 10, y: 10, z: 10 } },
        { light: new THREE.DirectionalLight(0xccff20, 0.4), position: { x: -10, y: 10, z: -10 } }
    ];
    const raycaster = new THREE.Raycaster();

    let camera = null;

    const ref = new Firebase('https://enchantment.firebaseio.com/player/' + playerId + '/character');
    ref.once('value', function getCharacter (snapshot) {
        character = snapshot.val() || character;

        let data = snapshot.val();

        character.position = data && data.position || { x: 0, y: 6, z: 0 };
        character.rotation = data && data.rotation || { x: 0, y: 0, z: 0 };
        character.scale = data && data.scale || { x: 1, y: 1, z: 1 };
        character.domain = data && data.domain || 'centralDomain';

        camera = initScene({
            scene: scene,
            renderer: renderer,
            lights: lights,
            camera: {
                type: 'PerspectiveCamera',
                angle: 45,
                aspectRatio: window.innerWidth / window.innerHeight,
                nearPlane: 1,
                farPlane: 300,
                position: { x: character.position.x, y: character.position.y, z: character.position.z },
                rotation: { x: character.rotation.x, y: character.rotation.y, z: character.rotation.z }
            }
        });

        ref.update(character);

        // Current domain of the logged in player.
        const domain = new Domain({
            firebaseUrl: 'https://enchantment.firebaseio.com/player/' + playerId + '/domain/' + character.domain,
            name: character.domain,
            camera: camera,
            scene: scene,
            renderer: renderer,
            raycaster: raycaster
        });

        scene.add(domain.still);
        scene.add(domain.mob);

    });


    // Test: display world axes.
    axes({ scene: scene, axesLength: 500 });

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

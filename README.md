# Single player adventure game
Enchantment (working title) is a free (for ever) browser based single player adventure game.

## Installation
```
npm install -g http-server
```

## Start running the game during development
```
http-server src
```

Browse to `http://localhost:8080`

## Debug mode
In your browser console, set window.debug to true and the debug mode will be switched on.

## Versions

### Next release tag
* 2.0.0
- Switched license from MIT to GPL 3.0
- Upgraded three.js from 87 to 91
- Switch to require.js modules
- Remove webpack
- Remove build step
- Remove React.js (just Three.js and plain Javascript)
- Remove Firebase
- Build procedural zones and store them locally for future reuse
- Show performance stats (top left) when key ESC is pressed.
- Add debug mode attached to the backtick/tilde key (just below ESC).
- Loading screen and play button.
- Basic version of lighting and shadows, this will need improving in a future release.
- Refactor handling pressing keys separately, because it's not just about player movement. It's a separate concern.
- Persist position of camera to localStorage and when reloading start there instead of origin.

#### Currently being developed
- Infinite zones: when player goes near edges of the current zone, generate procedurally the zones where he is likely to go to. These procedural zones should then stored in localStorage and read from there next time.

#### Next to develop
- Bug: when loading from a position other than zone-0:0, everything looks dark. Where did the zone light go?
- Bug: same as above, then casting Gate spell (key 7) and the origin cube is not animated. Why is that?
- Persist zones: each time the game loads, load the zone that has been procedurally generated where the player current is.
- Enable clicking on meshes (target). See raycaster in game.js
- Use the Clock to calculate delta and make sure animate runs at a consistent speed rather than be reliant on CPU. See Clock in game.js
- If I create a player character, this should be progressive and part of learning how to play the game interactively, like in Bethesda Game, The Elder Scrolls III: Morrowind 

### Released tags
* 1.0.0 remove Facebook integration and let anyone move around virtual environment without any login
* 0.10.1 single player fixes
* 0.10.0 single player
* 0.9.0 refactor data and classes
* 0.8.1 fix the keyboard controls to move within the scene.
* 0.8.0 sprite interaction
* 0.7.0 remove collada and use THREE.js models instead
* 0.6.0 Rules of the game documentation, refactoring to match the rules and ES6 refactoring.
* 0.5.0 React.js and webpack.
* 0.4.0 Migration to Firebase backend.
* 0.3.1 Migration to client side only with Grunt and Bower.
* 0.2.0 Original version from https://github.com/jicksta/Enchantment

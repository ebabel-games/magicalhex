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
* 2.1.0
- Identify performance issues and fix them, until the FPS goes back to 60.
- When loading one or several new zones, if it takes more than an instant, show a loading screen.
- Remove from scene zone meshes (and update loadedZones array) when the player has moved far enough from them, or the memory will run out.
- Enable clicking on meshes (target). See raycaster in game.js
- Use the Clock to calculate delta and make sure animate runs at a consistent speed rather than be reliant on CPU. See Clock in game.js
- Bug: empty zone when teleporting with gate spell. Steps to reproduce: move to another zone far enough from zone0:0, reload the whole page, cast the Gate spell. The zone0:0 is empty.
- If I create a player character, this should be progressive and part of learning how to play the game interactively, like in Bethesda Game, The Elder Scrolls III: Morrowind 

#### Currently being developed
- Noise of ground with vertices height needs to be persisted.
- Navigating the player needs to go up or down with raycaster based on ground.
- Populating the zone areas need to take ground noise into account.

### Released tags
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
- Infinite zones: when player goes near edges of the current zone, generate procedurally the zones where he is likely to go to.
- Bug solve: when loading from a position other than zone-0:0, everything looks dark.
- Persist zones: each time the game loads, load the zone that has been procedurally generated.
- Toggle grid, stats and debug mode.
- Make a random string map per zone to know where to place obstacles (walls) and static items (trees, stones, cut trees).

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

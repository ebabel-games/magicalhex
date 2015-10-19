# Enchantment & RetroQuest

Enchantment is a bleeding edge MMORPG game engine. RetroQuest is an attempt to rebuild the magic of EverQuest with the web technologies of today.

## Installation

```
npm install
bower install
```

## Build the game

There are 2 sets of tasks, one for development and one to run just before a deployment.

### During development

```
grunt watch
```

### Before deployment

```
grunt
```

## Start running the game during development

```
http-server src
```

If you haven't installed http-server already, install it by following instructions on https://www.npmjs.com/package/http-server

```
npm install http-server -g
```

Browse to

  http://localhost:8080

## Preview the game before a deployment

```
http-server build
```

## Deploy to Firebase

Note: you may need to adjust your firebase.json settings with `firebase init` after you have logged in with your own Firebase account. Refer to Firebase for further details.

```
firebase deploy
```

Browse to

  http://enchantment.firebaseapp.com

## Tasks

### Next steps

* host this demo on Firebase and document releases.
* rotating with controls seems to kill the performance of the heartbeat. investigate and fix this. use cancelAnimationFrame.
* Use require.js instead of loading all scripts into one file with Grunt, but only for my own scripts, not for dependencies. The dependencies should still be concatenated with Grunt and loaded as one script.
* Optimize memory usage by removing an object that animates beyond what the camera can see, after it has entered the camera field at least once (destructible flag initially set to false, becomes true when object is in the camera field).
* Move to three.js and Firebase
* Authenticate with Firebase, login with Facebook, create a character.
* Start interface in Chrome. Ignore other browsers, only focus on Chrome.
* Add Grunt.
* Use unit testing in spec (Jasmine) and add test coverage reporting.
* address three.js warnings

### Epics

* Persistent world
* Multiplayer
* Pathfinding
* Mob animations
* UI
* Character / Account creation
* Better content
* Map editor for defining mob patrols, fear lines, etc

### Features (that are already implemented)

* Load Collada models and animate them with their own custom heartbeat.
* Rotate around the world with mouse controls and arrow keys.

## Versions

### Next release tag

* 0.4.0 Migration to Firebase backend.

### Released tags

* 0.3.1 Migration to client side only with Grunt and Bower.
* 0.2.0 Original version from https://github.com/jicksta/Enchantment
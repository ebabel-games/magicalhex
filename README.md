# Enchantment

Enchantment is an attempt to rebuild the magic of EverQuest with the web technologies of today.

## Installation

```
npm install
bower install
npm install -g http-server
npm install -g webpack
```

## Build the game

```
webpack -w
```

## Start running the game during development

```
http-server public
```

Browse to

  http://localhost:8080

## Deploy to Firebase

Note: you may need to adjust your firebase.json settings with `firebase init` after you have logged in with your own Firebase account. Refer to Firebase for further details.

```
firebase deploy
```

Browse to

  https://enchantment.firebaseapp.com/

## Branching model

Tackle issues organised in the Github issues system.

Create one branch per issue. Name it after the milestone and words from the title.

For example, for issue "Authenticate with Firebase to login with Facebook" due for the "0.4.0" milestone, create a branch named 0.4.0/firebase-facebook-login

When the work is completed, merge back to the develop branch.

When a milestone is completed, increase the version number accordingly and release to Firebase. Create a tag for that release number and document it in this README.

## Features that are already implemented

* Load Collada models and animate them with their own custom heartbeat.

## Versions

### Next release tag

0.5.0 React.js and webpack

### Released tags

* 0.4.0 Migration to Firebase backend.
* 0.3.1 Migration to client side only with Grunt and Bower.
* 0.2.0 Original version from https://github.com/jicksta/Enchantment

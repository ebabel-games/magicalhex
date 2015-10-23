# Enchantment

Enchantment is an attempt to rebuild the magic of EverQuest with the web technologies of today.

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

0.5.0 Backbone.js, React.js and UX syncing when creating or updating a character.

### Released tags

* 0.4.0 Migration to Firebase backend.
* 0.3.1 Migration to client side only with Grunt and Bower.
* 0.2.0 Original version from https://github.com/jicksta/Enchantment

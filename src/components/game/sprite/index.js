import loadModel from '../loadModel';
import takeDamage from '../takeDamage';

import error from '../../shared/errorMessages';

// Base class of all sprites, i.e. players, mobs and terrain units that can be manipulated.
// Anything that has life, even if it's an inanimate object like a piece of terrain, will inherite this sprite class.
class Sprite {

    constructor (input) {
        if (!input) {
            throw new Error(error.input.required);
        }

        this.url = input.url || '/json-models/terrain-unit/terrain-unit.json';
        this.material = input.material;

        this.life = input.life || 1;
        this.dead = input.dead || false;
        this.corpses = input.corpses || [];
        this.position = input.position || { x: 0, y: 0, z: 0 };
        this.rotation = input.rotation || { x: 0, y: 0, z: 0 };

        loadModel({
            scene: input.scene,
            userData: this
        });
    }

    takeDamage: takeDamage;

}

module.exports = Sprite;

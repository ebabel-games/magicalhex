import THREE from 'three';

import Model from '../model';
import Mob from '../mob';

// Domain get all mobs from Firebase data and populates itself.
class Domain extends Model {

    constructor (input) {
        super(input);

        this.mesh.name = input.name || 'terrain';

        // todo: move from hard-coded collection of mobs to Firebase driven data.
        this.mob = [
            new Mob({
                firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + input.name + '/mob/john-laforge',
                name: 'john-laforge',
                targetName: 'John Laforge',
                race: 'human',
                position: { x: -5, y: 0, z: 0 },
                life: 3
            }),
            new Mob({
                firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + input.name + '/mob/sander-marsh',
                name: 'sander-marsh',
                targetName: 'Sander Marsh',
                race: 'human',
                position: { x: 5, y: 0, z: 0 },
                life: 3
            }),
            new Mob({
                firebaseUrl: 'https://enchantment.firebaseio.com/domain/' + input.name + '/mob/jolly-jumper',
                name: 'jolly-jumper',
                targetName: 'Jolly Jumper',
                race: 'animal',
                position: { x: 5, y: 0, z: 0 },
                life: 2
            })
        ];

        return this;        
    }

}

module.exports = Domain;

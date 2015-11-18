import THREE from 'three';

import Model from '../model';

import takeDamage from './takeDamage';
import fade from '../model/fade';

// 3D models.
import human from './human';
import animal from './animal';

class Mob extends Model {

    constructor (input) {
        super(input);

        let _mesh;

        switch (input.race) {
            case 'animal':
                _mesh = animal(input);
                break;
            default:
                // Human is the default.
                _mesh = human(input);
        }

        // The new mesh needs to copy from the Model's mesh.
        _mesh.userData = this.mesh.userData;

        // Copy methods from the Model's mesh.
        _mesh.update = this.mesh.update;

        // Merge of inherited mesh and the new model are now the current mesh.
        this.mesh = _mesh;

        // Order the model to take some damage, which decreases its life points by the amount of damage.
        // There is no negotiation at this point, when calling this function, the model has no choice but to take damages.
        this.mesh.takeDamage = takeDamage;

        // When a model is targetted, what name should it display.
        this.mesh.userData.targetName = input.targetName || 'a mob';

        // Set position, rotation and scale.
        this.mesh.position.set(input.position.x, input.position.y, input.position.z);
        this.mesh.rotation.set(input.rotation.x, input.rotation.y, input.rotation.z);
        this.mesh.scale.set(input.scale.x, input.scale.y, input.scale.z);

        // Set opacity when Mob is loaded.
        fade({
            model: this,
            opacity: this.mesh.userData.opacity
        });

        return this;
    }

}

module.exports = Mob;

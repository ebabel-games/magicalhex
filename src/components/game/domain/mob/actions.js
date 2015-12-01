import constants from '../../../shared/constants';

// Default mob actions to run in Render loop.
module.exports = [
    // A mob dies when its life hits 0 points.
    function die (mob) {
        if (!mob.userData.dead && mob.userData.life === 0) {
            mob.rotation.set(90 * Math.PI / 180, 0, 0);
            mob.position.y = mob.userData.deathY;
            mob.userData.dead = true;

            mob.fade({
                model: mob,
                opacity: mob.userData.life / mob.userData.maxLife + constants.minimumOpacity
            });
        }
    },

    // A mob is revived when its status is dead
    // but it has been given life.
    function revive (mob) {
        if (mob.userData.dead && mob.userData.life > 0) {
            mob.position.set(
                mob.userData.spawn.position[0],
                mob.userData.spawn.position[1],
                mob.userData.spawn.position[2]
            );
            mob.rotation.set(
                mob.userData.spawn.rotation[0],
                mob.userData.spawn.rotation[1],
                mob.userData.spawn.rotation[2]
            );
            mob.userData.dead = false;

            mob.fade({
                model: mob,
                opacity: mob.userData.life / mob.userData.maxLife + constants.minimumOpacity
            });
        }
    }
];

// A mob is revived when its status is dead
// but it has been given life.
module.exports = function revive (mob) {
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
    }
};

// A mob dies when its life hits 0 points.
module.exports = function die (mob) {
    if (!mob.userData.dead && mob.userData.life === 0) {
        mob.rotation.set(90 * Math.PI / 180, 0, 0);
        mob.position.y = mob.userData.deathY;
        mob.userData.dead = true;
    }
};

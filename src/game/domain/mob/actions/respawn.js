// After a while, a mob that is dead gets all its life back.
module.exports = function respawn (mob) {
    if (!mob.userData.dead) {
        return;
    }

    const timeSinceDead = Date.now() - mob.userData.timeOfDeath;

    if (mob.userData.dead && timeSinceDead > mob.userData.respawnTime) {
        mob.userData.life = mob.userData.maxLife;
    }
};



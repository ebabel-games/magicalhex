// Update opacity of a mob.
module.exports = function updateOpacity (mob) {
    mob.fade({
        model: mob,
        opacity: mob.userData.life / mob.userData.maxLife
    });
};

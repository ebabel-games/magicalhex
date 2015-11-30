module.exports = function executeActions (mob) {
    for(let index = 0, max = mob.userData.actions.length; index < max; index++) {
        mob.userData.actions[index](mob);
    }
};

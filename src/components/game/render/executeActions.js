// Run all the actions of a given mob.
module.exports = function executeActions (mob) {
    if (!mob.userData.actions || mob.userData.actions.length === 0) {
        return;
    }

    for (let index = 0, max = mob.userData.actions.length; index < max; index++) {
        let action = mob.userData.actions[index];

        if (action) {
            action(mob);
        }
    }
};

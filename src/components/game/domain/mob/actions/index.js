import die from './die';
import revive from './revive';
import updateOpacity from './updateOpacity';
import respawn from './respawn';

// Default mob actions to run in Render loop.
module.exports = [die, revive, updateOpacity, respawn];

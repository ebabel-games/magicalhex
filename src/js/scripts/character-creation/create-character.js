ebg.createCharacter = function createCharacter (input) {
    var player = input && input.player;
    var character;
    var ref = new Firebase('https://enchantment.firebaseio.com');

    if (!player) {
        throw new Error(ebg.err.player.notFound);
    }

    character = {
        name: document.getElementById('character-name').value,
        strength: document.getElementById('character-strength').value,
        dexterity: document.getElementById('character-dexterity').value,
        intelligence: document.getElementById('character-intelligence').value
    };

    ref.child('character/' + player.id).set(character);
};

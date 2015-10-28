ebg.createCharacter = function createCharacter (input) {
    var player = input && input.player;
    var character;

    if (!player) {
        throw new Error(ebg.err.player.notFound);
    }

    character = {
        name: document.getElementById('character-name').value,
        strength: document.getElementById('character-strength').value,
        dexterity: document.getElementById('character-dexterity').value,
        intelligence: document.getElementById('character-intelligence').value
    };

    ebg.ref.child('character/' + player.id).set(character);
};

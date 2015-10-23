ebg.showCharacterCreation = function showCharacterCreation (input) {
    var player = input && input.player;
    var character;
    var ref = new Firebase('https://enchantment.firebaseio.com');

    if (!player) {
        throw new Error(ebg.err.player.notFound);
    }

    document.getElementById('profile-image').src = player.profileImageUrl;

    document.getElementById('create-character').addEventListener('click', function (event) {

        ebg.createCharacter({
            player: player,
            event: event
        });

    });

    ref.child('character/' + player.id).once('value', 
        function getData (snapshot) {
            character = snapshot.val();
            document.getElementById('character-name').value = character.name;
            document.getElementById('character-strength').value = character.strength;
            document.getElementById('character-dexterity').value = character.dexterity;
            document.getElementById('character-intelligence').value = character.intelligence;
            document.getElementById('create-character').innerText = 'Update character';
        },
        function handleError (error) {
            // todo: display an error message.
            console.log(error);
        }
    );

    document.getElementById('character-creation').style.display = 'block';
};

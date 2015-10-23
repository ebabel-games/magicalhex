ebg.showCharacterCreation = function showCharacterCreation (input) {
    var player = input && input.player;

    if (!player) {
        throw new Error(ebg.err.player.notFound);
    }

    document.getElementById('profile-image').src = player.profileImageUrl;
    document.getElementById('display-name').value = player.displayName;

    document.getElementById('character-creation').style.display = 'block';
};

var ebg = {};

ebg.version = '0.3.1';

// Custom error messages from the game are listed here and used throughout.
ebg.err = {
    input: {
        required: 'Missing required input.'
    },
    error: {
        code: 'Missing error code.',
        messages: 'Missing error message.'
    }
};

// Current player. This is undefined until a player logs in.
ebg.player = undefined;

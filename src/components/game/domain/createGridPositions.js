// Create a grid of x and z positions.
module.exports = function createGridPositions (input) {
    const gridPositions = [];

    const width = input && input.width || 1000;
    const height = input && input.height || 1000;

    const boundaries = {
        west: width / -2,
        east: width / 2,
        north: height / -2,
        south: height / 2
    };

    const tileSize = input && input.tileSize || 10;

    for (let x = boundaries.west; x < boundaries.east; x = x + tileSize) {
        for (let z = boundaries.north; z < boundaries.south; z = z + tileSize) {
            gridPositions.push({x: x + tileSize / 2, z: z + tileSize / 2});
        }
    }

    return gridPositions;
};

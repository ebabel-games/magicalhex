define(['constants', 'area-small-woodland', 'area-empty-space', 'area-simple-labyrinth'], (C, areaSmallWoodland, areaEmptySpace, areaSimpleLabyrinth) => {
  // A zone band is a horizontal collection of 10 randomly selected areas accross the width of a zone.
  // pool: Pool of areas that can randomly be selected from.
  const zoneBand = (pool = [areaEmptySpace, areaSmallWoodland]) =>
    new Array(10).fill(null).map(selectedArea =>
      pool[Math.floor(Math.random() * pool.length)]);

  // An area is a small portion of a zone, 50 by 50 coordinates, and each coordinate is a square of 2m by 2m, and can be randomly picked to make up a portion of a zone.
  // The total surface of each area is therefore 100m by 100m and each zone takes 100 areas.
  // AreaMaps performs this random picking of multiple area maps.
  class AreaMaps {
    constructor() {
      const area = [];

      for (let bandIndex = 0; bandIndex < 10; bandIndex++) {
        const band = zoneBand([areaSimpleLabyrinth, areaSmallWoodland, areaEmptySpace]);

        for (let index = 0; index < 50; index++) {
          const line = [
            band[0][index],
            band[1][index],
            band[2][index],
            band[3][index],
            band[4][index],
            band[5][index],
            band[6][index],
            band[7][index],
            band[8][index],
            band[9][index],
          ].join('');
  
          area.push(line);
        }
      }

      return area;
    }
  }

  return AreaMaps;
});

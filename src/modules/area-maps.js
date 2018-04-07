define(
  ['constants', 'area-small-woodland', 'area-empty-space', 'area-simple-labyrinth', 'area-tree-circle'],
  (C, areaSmallWoodland, areaEmptySpace, areaSimpleLabyrinth, areaTreeCircle) => {
  // A zone band is a horizontal collection of 10 randomly selected areas accross the width of a zone.
  // pool: Pool of areas that can randomly be selected from. Each area has a weight, which represents how likely that area is to be picked.
  const zoneBand = (pool = [
      {area: areaSimpleLabyrinth, weight: 2},
      {area: areaSmallWoodland, weight: 20},
      {area: areaTreeCircle, weight: 50},
    ]) => {
      const totalWeight = pool.map(p => p.weight).reduce((a, b) => a + b);

      const randomPick = Math.floor(Math.random() * totalWeight);

      let selected = areaEmptySpace;
      let accumulated;

      accumulated = pool[0].weight;
      if (randomPick < accumulated) {
        selected = pool[0].area;
      }

      accumulated += pool[1].weight;
      if (randomPick >= pool[0].weight && randomPick < accumulated) {
        selected = pool[1].area;
      }

      accumulated += pool[2].weight;
      if (randomPick >= pool[1].weight && randomPick < accumulated) {
        selected = pool[2].area;
      }

      // Start with a zone band that is empty, filled with the area with nothing in it.
      const band = new Array(10).fill(areaEmptySpace);

      // Which of the 10 possible positions in the zone band are getting an area, the rest is empty.
      band[Math.floor(Math.random() * 10)] = selected;

      return band;
  }

  // An area is a small portion of a zone, 50 by 50 coordinates, and each coordinate is a square of 2m by 2m, and can be randomly picked to make up a portion of a zone.
  // The total surface of each area is therefore 100m by 100m and each zone takes 100 areas.
  // AreaMaps performs this random picking of multiple area maps.
  class AreaMaps {
    constructor() {
      const area = [];

      for (let bandIndex = 0; bandIndex < 10; bandIndex++) {
        const band = zoneBand();

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

define(['area-small-woodland', 'area-empty-space', 'area-simple-labyrinth'], (areaSmallWoodland, areaEmptySpace, areaSimpleLabyrinth) => {
  // An area is a small portion of a zone, 50 by 50, and can be randomly picked to make up a portion of a zone.
  // AreaMaps performs this random picking of multiple area maps.
  class AreaMaps {
    constructor() {
      return new Array(500).fill('').map((zoneRow, index) => {
        return [
          areaSimpleLabyrinth[index],
          areaEmptySpace[index],
          areaSmallWoodland[index],
          areaEmptySpace[index],
          areaSmallWoodland[index],
        ].join('') || '';;
      });
    }
  }

  return AreaMaps;
});

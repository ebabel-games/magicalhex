define(['constants', 'zone'], (C, Zone) => {
  const showHideGrid = (e) => {
    const currentZone = new Zone(e.detail.x, e.detail.z, e.detail.loadedZones, e.detail.scene);
    currentZone.toggleGrid();
    currentZone.toggleGround();

    e.preventDefault();
  };

  // Toggle showing or hiding the grid of the current zone.
  const toggleGrid = () => {
    document.addEventListener(C.EVENTS.TOGGLE_GRID, showHideGrid);
  };

  return toggleGrid;
});

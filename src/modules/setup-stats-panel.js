define(['constants'], (C) => {
  // Setup the stats panel, so that it's ready to show data when debug mode is turned on.
  // Note: this code must only be called once, not multiple times, otherwise the stats won't build up.
  const setupStatsPanel = () => {
    const stats = new Stats();
    stats.showPanel(false);
    document.body.appendChild(stats.dom);

    // Pres ESC key to show the stats.
    const toggleStats = (e) => {
      stats.showPanel(C.STATS_PANEL.FPS);
    };

    document.addEventListener(C.EVENTS.TOGGLE_STATS, toggleStats);

    return stats;
  };

  return setupStatsPanel;
});

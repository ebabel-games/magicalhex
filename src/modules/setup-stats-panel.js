define(['constants'], (C) => {
  // Setup the stats panel, so that it's ready to show data
  // when debug mode is turned on.
  // Note: this code must only be called once, not multiple times,
  // otherwise the stats won't build up.
  const setupStatsPanel = () => {
    const stats = new Stats();
    stats.showPanel(false);
    stats.dom.className = 'stats-panel';
    document.body.appendChild(stats.dom);

    const isDisplayed = () => {
      const fpsPanel = document.getElementsByClassName('stats-panel')[0].children[0].style.display;
      const msPanel = document.getElementsByClassName('stats-panel')[0].children[1].style.display;
      const mbPanel = document.getElementsByClassName('stats-panel')[0].children[2].style.display;

      return fpsPanel === 'block' || msPanel === 'block' || mbPanel === 'block';
    };

    // Pres ESC key to show the stats.
    const toggleStats = (e) => {
      if (isDisplayed()) {
        stats.showPanel(false); // Hide.
      } else {
        stats.showPanel(C.STATS_PANEL.FPS); // Show.
      }

      e.preventDefault();
    };

    document.addEventListener(C.EVENTS.TOGGLE_STATS, toggleStats);

    return stats;
  };

  return setupStatsPanel;
});

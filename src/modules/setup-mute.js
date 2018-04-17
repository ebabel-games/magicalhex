define(['constants'], (C) => {
  const setupMute = () => {
    const toggleMute = (e) => {
      if (Howler.volume() === C.MASTER_VOLUME.MUTE) {
        Howler.volume(C.MASTER_VOLUME.DEFAULT);
      } else {
        Howler.volume(C.MASTER_VOLUME.MUTE);
      }

      e.preventDefault();
    };

    document.addEventListener(C.EVENTS.TOGGLE_MUTE, toggleMute);

    return this;
  };

  return setupMute;
});

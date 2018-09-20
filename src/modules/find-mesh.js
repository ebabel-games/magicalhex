define([], () => {
  const findMesh = (scene, search, zone = 'zone0:0') => {
    const result = scene.getObjectByName(zone);

    if (!result || !result.children || result.children.length === 0) {
      return undefined;
    }

    return scene
      .getObjectByName(zone)
      .children.map(child => {
        if (child.name.indexOf(search) !== -1) {
          return child.name;
        }

        return undefined;
      })
      .filter(child => child !== undefined);
  };

  return findMesh;
});

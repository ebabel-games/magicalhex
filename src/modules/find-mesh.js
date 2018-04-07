define([], () => {
  const findMesh = (scene, search, zone = 'zone0:0') => scene
    .getObjectByName(zone)
    .children.map(child => {
      if (child.name.indexOf(search) !== -1) {
        return child.name;
      } else {
        return undefined;
      }
    })
    .filter(child => child !== undefined);

  return findMesh;
});

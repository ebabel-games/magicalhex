define([], () => {
  const rotateToHorizontal = (mesh) => mesh.rotation.set(-90 * Math.PI / 180, 0, 0);

  return rotateToHorizontal;
});

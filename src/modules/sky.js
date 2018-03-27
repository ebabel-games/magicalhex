define([], () => {
  const width = 1000;
  const height = 1000;

  const sky = () => {
    const texture = new THREE.TextureLoader().load('../textures/sky.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 256, height / 256);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
    );

    mesh.name = 'sky';

    return mesh;
  };

  return sky;
});

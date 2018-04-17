define(['constants'], (C) => {
  const width = C.ZONE_SIZE;
  const height = C.ZONE_SIZE;

  const sky = () => {
    const texture = new THREE.TextureLoader().load('textures/sky.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 256, height / 256);

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshLambertMaterial({ map: texture, side: THREE.FrontSide })
    );

    mesh.name = 'sky';

    return mesh;
  };

  return sky;
});

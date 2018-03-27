define([], () => {
  const ground = () => {
    const width = 1000;
    const height = 1000;

    const texture = new THREE.TextureLoader().load('textures/ground.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 256, height / 256);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
    );

    mesh.rotation.set(-90 * Math.PI / 180, 0, 0);
    mesh.name = 'ground';

    return mesh;
  };

  return ground;
});

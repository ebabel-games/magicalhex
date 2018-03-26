define([], () => {
  const sky = (camera) => {
    const width = 1000;
    const height = 1000;
  
    const texture = THREE.ImageUtils.loadTexture('/textures/sky.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 256, height / 256);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
    );
    
    mesh.name = 'sky';
    mesh.position.y = 500;
    mesh.position.z = camera.position.z - camera.far;

    return mesh;
  };

  return sky;
});

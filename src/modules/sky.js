define([], () => {
  const width = 1000;
  const height = 1000;

  // The height nudge helps avoiding a gap appears sometimes when camera is moving.
  const heightNudge = 5;

  const sky = (camera) => {
    const texture = new THREE.TextureLoader().load('/textures/sky.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 256, height / 256);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.FrontSide})
    );

    mesh.name = 'sky';
    mesh.position.y = height / 2 - heightNudge;
    mesh.position.z = camera.position.z - camera.far;

    // When the camera moves, the sky needs to adjust to stay in front of the camera.
    window.document.addEventListener('follow-camera', (e) => {
      console.log(e.detail);
    }, false);

    return mesh;
  };

  return sky;
});

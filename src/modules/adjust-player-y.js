define(['constants', 'round'], (C, round) => {
  // Check if the camera is getting too close to the ground and should
  // adjust its y position in relation to the ground.
  const adjustPlayerY = (currentZone, camera) => {
    if (currentZone && currentZone.meshes && currentZone.meshes.children
      && currentZone.meshes.children.length > 0) {
      const currentGround = currentZone.meshes.children.filter(mesh => mesh.name.indexOf('ground') !== -1);

      if (!currentGround || currentGround.length === 0) {
        return C.CAMERA.Y;
      }

      const cameraPosition = camera.position.clone();
      const origin = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      const direction = new THREE.Vector3(0, -500, 0);
      const rayDown = new THREE.Raycaster(origin, direction);
      rayDown.setFromCamera(direction, camera);
      const collisionResults = rayDown.intersectObjects(currentGround);

      if (collisionResults.length !== 0) {
        const distance = collisionResults[0].distance;
        return round(Math.abs(C.CAMERA.Y - distance) + C.CAMERA.Y, 1);
      }
    }

    return C.CAMERA.Y;
  };

  return adjustPlayerY;
});

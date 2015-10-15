// Initialize the scene and its camera.
ebg.initScene = function initScene() {
    ebg.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('webgl-container').appendChild(ebg.renderer.domElement);

    ebg.scene.add(ebg.light);

    ebg.camera = new THREE.PerspectiveCamera(
        35,     // Angle.
        window.innerWidth / window.innerHeight, // Ratio.
        1,      // Near plane.
        1000    // Far plane.
    );

    ebg.camera.position.z = 100;
    
    ebg.scene.add(ebg.camera);
};
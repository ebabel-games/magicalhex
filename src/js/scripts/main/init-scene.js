// Initialize the scene and return a camera.
ebg.initScene = function initScene (input) {
    var scene = input.scene;
    var renderer = input.renderer;
    var light = input.light;
    var camera;

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('webgl-container').appendChild(renderer.domElement);

    scene.add(light);

    camera = new THREE.PerspectiveCamera(
        35,     // Angle.
        window.innerWidth / window.innerHeight, // Ratio.
        1,      // Near plane.
        1000    // Far plane.
    );

    camera.position.z = 100;
    
    scene.add(camera);

    return camera;
};
// Create a dummy test cube.
ebg.dummy = ebg.dummy || {};

ebg.dummy.cube = function dummyCube() {

    var cube = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 20),
        new THREE.MeshBasicMaterial({color: 0xFF0000})
    );

    cube.name = 'dummyCube';

    return cube;
};
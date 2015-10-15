// Create a dummy test cube.
ebg.dummy = ebg.dummy || {};

ebg.dummy.cube = function dummyCube (input) {
    var size = input && input.size || 20;
    var color = input && input.color || 0xFF0000;
    var name = input && input.name || 'dummyCube';

    var cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({color: color})
    );
    cube.name = name;

    return cube;
};
import THREE from 'three';

module.exports = function build (input) {
    const body = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0xfeb186, fog: true, transparent: true, opacity: 1 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 8), material);
    head.position.set(0, 6.5, 0);
    head.name = 'head';
    body.add(head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.75, 0.75, 8), material);
    neck.position.set(0, 5.25, 0);
    neck.name = 'neck';
    body.add(neck);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 0.2, 4, 8), material);
    trunk.position.set(0, 2.875, 0);
    trunk.name = 'trunk';
    body.add(trunk);

    return body;
};

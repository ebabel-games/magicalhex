import THREE from 'three';

import d2r from '../../degreesToRadians';

module.exports = function build (input) {
    const body = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: 0x7b4b2a, fog: true, transparent: true, opacity: 1 });

    const leftHindLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.2, 5, 6), material);
    leftHindLeg.position.set(2, 2.5, -5);
    leftHindLeg.name = 'left-hind-leg';
    body.add(leftHindLeg);

    const rightHindLeg = leftHindLeg.clone();
    rightHindLeg.position.z = -3;
    rightHindLeg.name = 'right-hind-leg';
    body.add(rightHindLeg);

    const leftFrontLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.2, 5, 6), material);
    leftFrontLeg.position.set(6.9, 2, -4.5);
    leftFrontLeg.name = 'left-front-leg';
    body.add(leftFrontLeg);

    const rightFrontLeg = leftFrontLeg.clone();
    rightFrontLeg.position.z = -3.5;
    rightFrontLeg.name = 'right-front-leg';
    body.add(rightFrontLeg);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 6, 8), material);
    trunk.position.set(4.35, 5, -4);
    trunk.rotation.set(d2r(90), 0, d2r(-90));
    trunk.name = 'trunk';
    body.add(trunk);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 3.5, 6), material);
    neck.position.set(6.45, 7, -4)
    neck.name = 'neck';
    body.add(neck);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.75, 2, 8), material);
    head.position.set(7, 9, -4)
    head.rotation.set(d2r(90), 0, d2r(-90));
    head.name = 'head';
    body.add(head);

    return body;
}
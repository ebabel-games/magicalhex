var camera, controls, scene, renderer;

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.005 );

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 500 );
    camera.position.set(0, 6, 50);
    camera.rotation.x = -40 * Math.PI / 180;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    // Rock texture.
    var rockTexture = THREE.ImageUtils.loadTexture('rock.jpg');
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.repeat.set(1, 1);

    // Rock geometry.
    var rockGeometry = new THREE.Geometry();
    rockGeometry.vertices.push(new THREE.Vector3(-2, 0, -14));  // 0
    rockGeometry.vertices.push(new THREE.Vector3(-6, 0, -10));  // 1
    rockGeometry.vertices.push(new THREE.Vector3(-8, 0, 0));    // 2
    rockGeometry.vertices.push(new THREE.Vector3(-6, 0, 8));    // 3
    rockGeometry.vertices.push(new THREE.Vector3(2, 0, 10));    // 4
    rockGeometry.vertices.push(new THREE.Vector3(8, 0, 4));     // 5
    rockGeometry.vertices.push(new THREE.Vector3(8, 0, 0));     // 6
    rockGeometry.vertices.push(new THREE.Vector3(6, 0, -10));   // 7
    rockGeometry.vertices.push(new THREE.Vector3(-6, 1, -1));   // 8
    rockGeometry.vertices.push(new THREE.Vector3(0, 2, 6));     // 9
    rockGeometry.vertices.push(new THREE.Vector3(6, 2, 2));     // 10
    rockGeometry.vertices.push(new THREE.Vector3(0, 4, -8));    // 11

    rockGeometry.faces.push(new THREE.Face3(0, 1, 11));         // A
    rockGeometry.faces.push(new THREE.Face3(1, 8, 11));         // B
    rockGeometry.faces.push(new THREE.Face3(1, 2, 8));          // C
    rockGeometry.faces.push(new THREE.Face3(2, 3, 8));          // D
    rockGeometry.faces.push(new THREE.Face3(3, 9, 8));          // E
    rockGeometry.faces.push(new THREE.Face3(3, 4, 9));          // F
    rockGeometry.faces.push(new THREE.Face3(4, 5, 9));          // G
    rockGeometry.faces.push(new THREE.Face3(5, 6, 10));         // H
    rockGeometry.faces.push(new THREE.Face3(6, 7, 10));         // I
    rockGeometry.faces.push(new THREE.Face3(7, 0, 11));         // J
    rockGeometry.faces.push(new THREE.Face3(8, 9, 11));         // K
    rockGeometry.faces.push(new THREE.Face3(5, 10, 9));         // L
    rockGeometry.faces.push(new THREE.Face3(7, 11, 10));        // M
    rockGeometry.faces.push(new THREE.Face3(9, 10, 11));        // N

    rockGeometry.computeFaceNormals();
    rockGeometry.computeVertexNormals();

    // Rock mesh.
    var rock = new THREE.Mesh(rockGeometry, 
        new THREE.MeshLambertMaterial({
            map: rockTexture,
            vertexColors: THREE.VertexColors,
            side: THREE.DoubleSide
        }));

    scene.add(rock);

    // Rocks.
    var rocks = plotModelsOnGrid({
        model: rock,
        numberModelsToPlot: 100,
        positionY: 0,
        scale: false
    });

    // Add all models to the scene.
    scene.add(rocks.group);

    // Lights.
    var intensity = 0.2;
    light = new THREE.HemisphereLight(0xffffcc, 0x080820, intensity);
    scene.add(light);
    light = new THREE.DirectionalLight(0xccff20, intensity);
    light.position.set(10, 10, 10);
    scene.add(light);
    light = new THREE.DirectionalLight(0xccff20, intensity);
    light.position.set(-10, 10, -10);
    scene.add(light);

    window.addEventListener( 'resize', onWindowResize, false );
}

// Return the models as a group and the remaining 
// grid positions still free to be plotted on.
// Note: No model is added to the scene, only clones of the model are grouped and returned, 
// for performance optimization.
function plotModelsOnGrid (input) {
    // The empty container where all model instances will be grouped.
    var group = input && input.group || new THREE.Group();

    // Model to be plotted on the grid free positions.
    var model = input && input.model;

    var positionY = input && input.positionY || 0;

    // Grid co-ordinates not already plotted with a model.
    var freeGridPositions = input && input.freeGridPositions || createGridPositions();
    var freeGridPositionsLength = freeGridPositions.length;

    // Number of model instances to plot.
    var numberModelsToPlot = input && input.numberModelsToPlot || 
        ((freeGridPositionsLength > 20) ? 20 : freeGridPositionsLength);

    var scale = input && input.scale;
    var rotate = input && input.rotate || false;

    // Positions that have been plotted with a model.
    var plottedPositions = [];

    for (var counter = 0; counter < numberModelsToPlot; counter++) {
        // Pick a random position from the array of positions still available.
        var index = Math.floor(Math.random() * freeGridPositions.length);
        var position = freeGridPositions[index];
        var size = scale ? (Math.random() * scale.max + scale.min) : 1;
        var rotation = rotate ? Math.random() * (-45 * Math.PI / 180) : 0;

        // Remove the plotted position from the array of free positions.
        freeGridPositions.splice(index, 1);

        // Add the plotted position to the array of positions that have been plotted.
        plottedPositions.push(position);

        // Create a clone and place it at the correct position.
        var clone = model.clone();
        clone.position.set(position.x, positionY, position.z);
        clone.scale.set(size, size, size);
        clone.rotation.set(0, rotation, 0);
        group.add(clone);
    }

    return {
        group: group,
        plottedPositions: plottedPositions,
        freeGridPositions: freeGridPositions
    };
}

// Create a grid of x and z positions.
function createGridPositions (input) {
    var gridPositions = [];

    var width = input && input.width || 1000;
    var height = input && input.height || 1000;

    var boundaries = {
        west: width / -2,
        east: width / 2,
        north: height / -2,
        south: height / 2
    };

    var tileSize = input && input.tileSize || 10;

    for (var x = boundaries.west; x < boundaries.east; x = x + tileSize) {
        for (var z = boundaries.north; z < boundaries.south; z = z + tileSize) {
            gridPositions.push({x: x + tileSize / 2, z: z + tileSize / 2});
        }
    }

    return gridPositions;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();
    render();
}

function render() {
    renderer.render( scene, camera );
}
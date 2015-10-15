// Render the scene.
ebg.render = function render() {
    ebg.renderer.render(ebg.scene, ebg.camera);
    requestAnimationFrame(ebg.render);
};

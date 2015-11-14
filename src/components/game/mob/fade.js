// Fade a model's opacity to a given value.
module.exports = function fade (input) {

	const model = input && input.model;
	const opacity = input && input.opacity;

	const setOpacity = function setOpacity (material, opacity) {
		material.opacity = opacity;
	}

	if (model.material) {
		setOpacity(model.material, opacity);
	}

    if (model.children && model.children.length > 0) {
    	model.children.map(function (child) {
    		setOpacity(child.material, opacity);
    	});
    }
};

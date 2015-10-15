(function() {

	var canvasElement = document.getElementById('ce');
	var ctx = canvasElement.getContext('webgl');

	ctx.clearColor(1,0,0,1);

	ctx.clear(ctx.COLOR_BUFFER_BIT);

}());
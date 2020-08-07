//By Drayton Monkman, June 2020

$(document).ready(function(){
	var canvas = $("#screen");
	var ctx = canvas.get(0).getContext("2d");
	canvasWidth=canvas.width();
	canvasHeight=canvas.height();
	
	var pixelData = 0;
	
	var renderer = new Renderer(ctx, canvasWidth, canvasHeight, [0, 2, -10], [0, 0, 1]);
	
	const tickRate = 120;	
	const tickTime = 1000/tickRate;	
	var frameRate = 60;			
	var frameTime = 1000/frameRate; 
	var tFrameStart = 0;
	var tFrameEnd= 0;
	var tTickStart = 0;
	var tTickEnd = 0;
	var tPrevDraw = 0;
	var tSinceLastFrame = 0;
	
	var ticks = 0;
	var frames = 0;
	
	var position = new Vector3D(0, 0, 1);
	var direction = new Vector3D(0, 0, 1);
	
	var KeyDown = [];

	const Keys = {
		ZERO: 48,
		ONE: 49,
		TWO: 50,
		THREE: 51,
		FOUR: 52,
		FIVE: 53,
		SIX: 54,
		SEVEN: 55,
		EIGHT: 56,
		NINE: 57,
		A: 65,
		B: 66,
		C: 67,
		D: 68,
		E: 69,
		F: 70,
		H: 71,
		G: 72,
		I: 73,
		J: 74,
		K: 75,
		L: 76,
		M: 77,
		N: 78,
		O: 79,
		P: 80,
		Q: 81,
		R: 82,
		S: 83,
		T: 84,
		U: 85,
		V: 86,
		W: 87,
		X: 88,
		Y: 89,
		Z: 90,
	};
	
	// Detect when the user presses a key
	document.onkeydown = function(event){	
		KeyDown[event.keyCode] = true;
	};
	
	// Detect when the user lifts off of a key
	document.onkeyup = function(event){		
		KeyDown[event.keyCode] = false;
	};
	
	// Initialize what we want to draw
	for(var i = 0; i < 256; i++){
		KeyDown[i] = false;
	}
	var V1 = new Vector3D(2,4,0);
	var cube = new Cube(new Vector3D(0, 0, 6));
	var matrix = new Mat4x4();
	var myVar = 0;
	var cubes = [];
	for(var i = 0; i < 8; i++){
		for(var j = 0; j < 8; j++){
			cubes.push(new Cube(i, 0, j, 1));
		}
	}
	cube1 = new Cube(1, 1, 6, 10);	
	cube2 = new Cube(5, 5, 7, 5);	
	var teapotMesh = new Mesh();
	function Load(){
		var line = [];
		for(var i = 0; i < teapotobj.length; i++){
			line = teapotobj[i].split(' ');
			if(line[0] == 'v'){
				teapotMesh.vertices.push(new Vector3D(parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])));
			}
			else if(line[0] == 'f'){
				teapotMesh.faces.push(new Array(parseInt(line[1])-1, parseInt(line[2])-1, parseInt(line[3])-1));
			}
		}
		//console.log(teapotMesh.faces);
    }
	// Handle all key inputs
	function Input(){
		if(KeyDown[Keys.W]){
			renderer.pos.addAssign(renderer.dir.scale(0.1));
		}
		if(KeyDown[Keys.S]){
			renderer.pos.subAssign(renderer.dir.scale(0.1));
		}
		if(KeyDown[Keys.A]){
			renderer.pos.addAssign(renderer.dir.scale(0.1).crossProduct(new Vector3D(0, 1, 0)));
		}
		if(KeyDown[Keys.D]){
			renderer.pos.subAssign(renderer.dir.scale(0.1).crossProduct(new Vector3D(0, 1, 0)));
		}
		if(KeyDown[Keys.ONE]){
			renderer.dir.rotate(-0.01, new Axis(0, 0, 0, 0, 1, 0));
			renderer.dir.normalize();
		}
		if(KeyDown[Keys.TWO]){
			renderer.dir.rotate(+0.01, new Axis(0, 0, 0, 0, 1, 0));
			renderer.dir.normalize();
		}
		if(KeyDown[Keys.THREE]){
			renderer.FOV -= 0.01;
			renderer.FOV = Math.max(renderer.FOV, Math.PI/6);
			renderer.invTanFOV = 1/Math.tan(renderer.FOV/2);
		}
		if(KeyDown[Keys.FOUR]){
			renderer.FOV += 0.01;
			renderer.FOV = Math.min(renderer.FOV, 5*Math.PI/6);
			renderer.invTanFOV = 1/Math.tan(renderer.FOV/2);
		}
	}
	
	// Handle all changes to the environment that do not result from input
	function Engine(){
		cube1.rotate(-0.01, new Vector3D(1,1,0));
	}
	
	// Draw objects and text to the screen
	function Render(){
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		ctx.fillStyle = "#FFFFFF";
		ctx.strokeStyle = "#FFFFFF";
		
		// Display the current camera position and viewing direction
		ctx.fillText("Position: " + renderer.pos.x + ", " + renderer.pos.y + ", " + renderer.pos.z, 10, 20);
		ctx.fillText(renderer.pos.y, 10, 30);
		ctx.fillText(renderer.pos.z, 10, 40);
		ctx.fillText(renderer.dir.x, 10, 50);
		ctx.fillText(renderer.dir.y, 10, 60);
		ctx.fillText(renderer.dir.z, 10, 70);
		ctx.fillText(Keys.W, 10, 80);
		ctx.fillText(KeyDown[Keys.W], 10, 90);

		// Draw the x,y,z axis
		ctx.strokeStyle = "#FF0000";
		renderer.drawLine(new Vector3D(0, 0, 0), new Vector3D(50000, 0, 0));
		ctx.strokeStyle = "#00FF00";
		renderer.drawLine(new Vector3D(0, 0, 0), new Vector3D(0, 50000, 0));
		ctx.strokeStyle = "#0000FF";
		renderer.drawLine(new Vector3D(0, 0, 0), new Vector3D(0, 0, 50000));
		ctx.strokeStyle = "#FFFFFF";
		
		// Queue all cubes to be rendered
		for(var i = 0; i < cubes.length; i++){
			cubes[i].draw(renderer);
		}	
		
		// Queue all meshes to be rendered (in this case only the teapot)
		renderer.renderMesh(teapotMesh);
		
		// Draw all previously queued objects to be rendered
		renderer.renderTriangles();
		renderer.renderTriangles2D();
		renderer.ctx.fillText(renderer.triangleQueue.length, 10, 200);
	};
	
	function main(){
		// Start time of the new tick and end of the previous tick
		tTickEnd = performance.now();		
		
		// Add time since last frame
		tSinceLastFrame += tTickEnd - tTickStart;			
		tTickStart = tTickEnd;
		
		Input();				// Poll for user input
		Engine();				// Perform calculations and actions within the engine
		
		// Draw a new frame if enough time has passed
		if(tSinceLastFrame >= frameTime)
		{
			tSinceLastFrame -= frameTime;
			Render();
			tFrameEnd = performance.now();		// End time of the frame
			prevFrameTime = tFrameEnd - tFrameStart;
			ctx.fillText("Time since last frame: " + prevFrameTime, 10, 160);
			ctx.fillText("Frame rate: " + 1000/Math.round(prevFrameTime), 10, 10);
			tFrameStart = tFrameEnd;
			frames++;
		}
		ticks++;
		ctx.fillText("Ticks : " + ticks, 10, 100);
		ctx.fillText("Frames : " + frames, 10, 110);
		setTimeout(main, 0);
		//setTimeout(main, tickTime-(performance.now()-tTickStart));
	};
	Load();
	main();
	return;
});


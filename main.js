//By Drayton Monkman, June 2020

$(document).ready(function(){
	var canvas = $("#screen");
	var ctx = canvas.get(0).getContext("2d");
	canvasWidth=canvas.width();
	canvasHeight=canvas.height();

	var position = new Vector3D(0, 0, 1);
	var direction = new Vector3D(0, 0, 1);
	
	var camera = new Camera(ctx, canvasWidth, canvasHeight, [0, 2, -10], [0, 0, 1], [0, 1, 0]);
	
	const tickRate = 10;	
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
	var printTris = false;

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
	
	// Initialize keys
	for(var i = 0; i < 256; i++){
		KeyDown[i] = false;
	}
	gameObjects = [];
	this.print = false;
	// Load assets required for the program
	function Load(){


		// Greate a large cube
		gameObjects.push(new Cube(-50, -100, 100, 100));


		// Create some cube game objects to represent the x, y, z axes
		gameObjects.push(new Cube(0, 0, 0, 1));
		for(var i = 1; i < 6; i++){
			gameObjects.push(new Cube(0, 0, i, 1));
			gameObjects.push(new Cube(i, 0, 0, 1));
			gameObjects.push(new Cube(0, i, 0, 1));
		}

		// Load a plane at y = -100
		gameObjects.push(new Plane(-500, -10, -500, 1000, color = "#000088"))
		
		// Load the teapot game object
		gameObjects.push(new GameObject(5, 1, 5, teapotobj))
    }
	// Handle all key inputs
	function Input(){
		if(KeyDown[Keys.Z]){
			// Reset camera vectors using the rotation Quaternion 
			var Q = camera.rotation
			camera.direction.rotate_origin(2*Math.acos(Q.w), new Vector3D(Q.x, Q.y, Q.z))
			camera.up.rotate_origin(2*Math.acos(Q.w), new Vector3D(Q.x, Q.y, Q.z))
			camera.right.rotate_origin(2*Math.acos(Q.w), new Vector3D(Q.x, Q.y, Q.z))
			camera.rotation = new Quaternion()
		}
		if(KeyDown[Keys.W]){
			camera.position.addAssign(camera.direction.scale(0.2));
		}
		if(KeyDown[Keys.S]){
			camera.position.subAssign(camera.direction.scale(0.2));
		}
		if(KeyDown[Keys.A]){
			camera.position.addAssign(camera.right.scale(-0.2));
		}
		if(KeyDown[Keys.D]){
			camera.position.subAssign(camera.right.scale(-0.2));
		}
		if(KeyDown[Keys.ONE]){
			camera.yaw(-0.02)
		}
		if(KeyDown[Keys.TWO]){
			camera.yaw(0.02)
		}
		if(KeyDown[Keys.E]){
			camera.roll(-0.02)
		}
		if(KeyDown[Keys.Q]){
			camera.roll(0.02)
		}
		if(KeyDown[Keys.R]){
			camera.pitch(0.02)
		}
		if(KeyDown[Keys.F]){
			camera.pitch(-0.02)
		}
		if(KeyDown[Keys.THREE]){
			//printTris = true;
			
			camera.FOV -= 0.01;
			camera.FOV = Math.max(camera.FOV, Math.PI/6);
			camera.invTanFOV = 1/Math.tan(camera.FOV/2);
			
		}
		if(KeyDown[Keys.FOUR]){
			
			camera.FOV += 0.01;
			camera.FOV = Math.min(camera.FOV, 5*Math.PI/6);
			camera.invTanFOV = 1/Math.tan(camera.FOV/2);
		}
		if(KeyDown[Keys.FIVE]){
			camera.DEBUG = false;
		}
		if(KeyDown[Keys.SIX]){
			camera.DEBUG = true;
		}
		if(KeyDown[Keys.G]){
			console.log(true)
			printTris = true;
		}
	}
	
	// Handle all changes to the environment that do not result from input
	function Engine(){
		//cube1.rotate(-0.01, new Vector3D(1,1,0));
		
	}
	
	// Draw objects and text to the screen
	function Render(){

		//Fill the backgrounds
		//camera.position.addAssign(camera.direction)
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		ctx.fillStyle = "#FFFFFF";
		ctx.strokeStyle = "#FFFFFF";
		var grd = ctx.createLinearGradient(canvasWidth/2, canvasHeight, canvasWidth/2, 0);
		grd.addColorStop(1, '#8888DD');
		grd.addColorStop(0, "white");
		ctx.fillStyle = grd;


		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		/*
		var grd = ctx.createLinearGradient(canvasWidth/2, canvasHeight/2, canvasWidth/2, canvasHeight);
		grd.addColorStop(1, '#0000FF');
		grd.addColorStop(0, "#4444EE");
		ctx.fillStyle = grd;
		ctx.fillRect(0, canvasHeight/2, canvasWidth, canvasHeight);*/

		// Draw the x,y,z axis
		//ctx.strokeStyle = "#FF0000";
		//camera.drawLine(new Vector3D(0, 0, 0), new Vector3D(50000, 0, 0));
		//ctx.strokeStyle = "#00FF00";
		//camera.drawLine(new Vector3D(0, 0, 0), new Vector3D(0, 50000, 0));
		//ctx.strokeStyle = "#0000FF";
		//camera.drawLine(new Vector3D(0, 0, 0), new Vector3D(0, 0, 50000));
		//ctx.strokeStyle = "#FFFFFF";
		
		// Queue all game objects to be rendered
		for(var i = 0; i < gameObjects.length; i++){
			gameObjects[i].draw(camera);
		}	

		// Draw all previously queued objects to be rendered
		camera.draw(printTris);
		
		// Display the current camera position and viewing direction
		ctx.fillStyle = "#000000";
		ctx.fillText("Position: x:" + camera.position.x.toFixed(3) + ", y:" + camera.position.y.toFixed(3) + ", z:" + camera.position.z.toFixed(3), 10, 20);
		ctx.fillText("Direction: x:" + camera.direction.x.toFixed(3) + ", y:" + camera.direction.y.toFixed(3) + ", z:" + camera.direction.z.toFixed(3), 10, 30);
		ctx.fillText("Up: x:" + camera.up.x.toFixed(3) + ", y:" + camera.up.y.toFixed(3) + ", z:" + camera.up.z.toFixed(3), 10, 40);
		ctx.fillText("Right: x:" + camera.right.x.toFixed(3) + ", y:" + camera.right.y.toFixed(3) + ", z:" + camera.right.z.toFixed(3), 10, 50);
		ctx.fillText("Rotation: w:" + camera.rotation.w.toFixed(3) + ", x:" + camera.rotation.x.toFixed(3) + ", y:" +camera.rotation.y.toFixed(3) + ", z:" + camera.rotation.z.toFixed(3), 10, 70)

		//camera.renderTriangles2D();
		camera.ctx.fillText(camera.triangleQueue.length, 10, 200);
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
			ctx.fillStyle = "#000000";
			ctx.fillText("Time since last frame: " + prevFrameTime.toFixed(3), 10, 160);
			ctx.fillText("Frame rate: " + (1000/prevFrameTime).toFixed(1), 10, 10);
			tFrameStart = tFrameEnd;
			frames++;
		}
		ticks++;
		ctx.fillStyle = "#000000";
		ctx.fillText("Ticks : " + ticks, 10, 100);
		ctx.fillText("Frames : " + frames, 10, 110);
		setTimeout(main, 0);
		//setTimeout(main, tickTime-(performance.now()-tTickStart));
	};
	
	Load();
	main();
	return;
});


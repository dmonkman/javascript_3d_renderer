class Camera {
	constructor(ctx, canWidth, canHeight, position, direction){
		this.ctx = ctx;
		this.screenWidth = canWidth;
		this.screenHeight = canHeight;

		this.projectionMatrix = Matrix_MakeProjection(90, this.screenHeight / this.screenWidth, 0.1, 1000.0)
		this.position = new Vector3D(position[0], position[1], position[2]);
		this.direction = new Vector3D(direction[0], direction[1], direction[2]);
		this.FOV = Math.PI/2;
		this.aspectRatio = canWidth/canHeight;
		this.invTanFOV = 1/Math.tan(this.FOV/2);
		this.triangleQueue = [];
		this.renderQueue = [];
		this.ctx.fillStyle = "#FFFFFF";
		this.DEBUG = false;
	}
	// Project a point in 3D space to a point on the display
	pointTransform(Point) {
		var line = Point.sub(this.position);		// Find the vector from camera to point
		var depth = line.length();				// Find the absolute distance from camera to point
		// var cosTheta = this.direction.dotProduct(line)/(this.direction.length()*depth);
		var t = 1/(this.direction.dotProduct(line));		// t is the parameter value of the line when interstecting the plane of the canvas
		var drawPos = line.rotate(-Math.atan2(this.direction.x, this.direction.z), new Axis(0, 0, 0, 0, 1, 0));
		drawPos = drawPos.scale(t);
		drawPos.x = this.screenWidth*(this.invTanFOV*drawPos.x + 0.5);
		drawPos.y = this.screenHeight*(0.5 - this.invTanFOV*drawPos.y);
		drawPos.z = depth;
		return drawPos;
	}

	// Draw a line in 3D space from VertexA to VertexB
	drawLine(VertexA, VertexB) {
		var lineA = VertexA.sub(this.position);
		var depthA = lineA.length();
		var cosTheta = this.direction.dotProduct(lineA)/(this.direction.length()*depthA);
		var tA = 1/(this.direction.dotProduct(lineA));		// t is the parameter value of the line when interstecting the plane of the canvas
		var drawPosA = lineA.rotate(-Math.atan2(this.direction.x, this.direction.z), new Axis(0, 0, 0, 0, 1, 0));
		drawPosA = drawPosA.scale(tA);
		drawPosA.x = this.screenWidth*(this.invTanFOV*drawPosA.x + 0.5);
		drawPosA.y = this.screenHeight*(0.5 - this.invTanFOV*drawPosA.y);
		drawPosA.z = depthA*cosTheta/this.invTanFOV;
		
		var lineB = VertexB.sub(this.position);
		var depthB = lineB.length();
		cosTheta = this.direction.dotProduct(lineB)/(this.direction.length()*depthB);
		var tB = 1/(this.direction.dotProduct(lineB));		// t is the parameter value of the line when interstecting the plane of the canvas
		var drawPosB = lineB.rotate(-Math.atan2(this.direction.x, this.direction.z), new Axis(0, 0, 0, 0, 1, 0));
		drawPosB = drawPosB.scale(tB);
		drawPosB.x = this.screenWidth*(this.invTanFOV*drawPosB.x + 0.5);
		drawPosB.y = this.screenHeight*(0.5 - this.invTanFOV*drawPosB.y);
		drawPosB.z = depthB*cosTheta/this.invTanFOV;

		if(tA>0 && tB>0){
			this.ctx.beginPath();
			this.ctx.moveTo(drawPosA.x, drawPosA.y);
			this.ctx.lineTo(drawPosB.x, drawPosB.y);
			this.ctx.stroke();
		}
	}

	sortObj(obj) {
		return Object.keys(obj).sort().reduce(function (result, key) {
			result[key] = obj[key];
			return result;
		}, {});
	}
	

	Triangle_ClipAgainstPlane(plane_p, plane_n, in_tri)
	{
		// Make sure plane normal is indeed normal
		var plane_n = Vector_Normalise(plane_n);

		// Create two temporary storage arrays to classify points either side of plane
		// If distance sign is positive, point lies on "inside" of plane
		var inside_points = [];  var nInsidePointCount = 0;
		var outside_points = []; var nOutsidePointCount = 0;

		// Return signed shortest distance from point to plane, plane normal must be normalised
		function dist(p)
		{
			n = new Vector3D()
			var n = Vector_Normalise(p);
			return (plane_n.x * p.x + plane_n.y * p.y + plane_n.z * p.z - Vector_DotProduct(plane_n, plane_p));
		};

		// Get signed distance of each point in triangle to plane
		var d0 = dist(in_tri.vert[0]);
		var d1 = dist(in_tri.vert[1]);
		var d2 = dist(in_tri.vert[2]);

		if (d0 >= 0) { inside_points[nInsidePointCount++] = in_tri.vert[0]; }
		else { outside_points[nOutsidePointCount++] = in_tri.vert[0]; }
		if (d1 >= 0) { inside_points[nInsidePointCount++] = in_tri.vert[1]; }
		else { outside_points[nOutsidePointCount++] = in_tri.vert[1]; }
		if (d2 >= 0) { inside_points[nInsidePointCount++] = in_tri.vert[2]; }
		else { outside_points[nOutsidePointCount++] = in_tri.vert[2]; }

		// Now classify triangle points, and break the input triangle into 
		// smaller output triangles if required. There are four possible
		// outcomes...

		var out_tri = []
		out_tri[0] = new Triangle()

		if (nInsidePointCount == 0)
		{
			// All points lie on the outside of plane, so clip whole triangle
			// It ceases to exist

			return []; // No returned triangles are valid
		}

		if (nInsidePointCount == 3)
		{
			// All points lie on the inside of plane, so do nothing
			// and allow the triangle to simply pass through

			return in_tri; // Just the one returned original triangle is valid
		}

		if (nInsidePointCount == 1 && nOutsidePointCount == 2)
		{
			// Triangle should be clipped. As two points lie outside
			// the plane, the triangle simply becomes a smaller triangle

			// Copy appearance info to new triangle
			out_tri[0].color =  in_tri.color;

			// The inside point is valid, so keep that...
			out_tri[0].vert[0] = inside_points[0];

			// but the two new points are at the locations where the 
			// original sides of the triangle (lines) intersect with the plane
			out_tri[0].vert[1] = Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[0]);
			out_tri[0].vert[2] = Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[1]);

			return out_tri; // Return the newly formed single triangle
		}

		if (nInsidePointCount == 2 && nOutsidePointCount == 1)
		{
			out_tri[1] = new Triangle()
			// Triangle should be clipped. As two points lie inside the plane,
			// the clipped triangle becomes a "quad". Fortunately, we can
			// represent a quad with two new triangles

			// Copy appearance info to new triangles
			out_tri[0].color =  in_tri.color;
			out_tri[1].color =  in_tri.color;

			// The first triangle consists of the two inside points and a new
			// point determined by the location where one side of the triangle
			// intersects with the plane
			out_tri[0].vert[0] = inside_points[0];
			out_tri[0].vert[1] = inside_points[1];
			out_tri[0].vert[2] = Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[0]);

			// The second triangle is composed of one of he inside points, a
			// new point determined by the intersection of the other side of the 
			// triangle and the plane, and the newly created point above
			out_tri[1].vert[0] = inside_points[1];
			out_tri[1].vert[1] = out_tri[0].vert[2];
			out_tri[1].vert[2] = Vector_IntersectPlane(plane_p, plane_n, inside_points[1], outside_points[0]);

			return out_tri // Return two newly formed triangles which form a quad
		}
	}

	// Project a 3D triangle into a 2D triangle on the display
	queueTriangle(Tri){
		this.triangleQueue.push(Tri)
		return
		/*
		// Find the vector from camera to point
		var line = Tri.midpoint.sub(this.position);
		
		// Find the cos between the face normal and the camera vector
		var cosNormal = line.dotProduct(Tri.normal);

		// If the triangle is facing away from the camera, ignore the triangle and return
		if(cosNormal>0)
			return 0;
		/*

		// If the triange is behind the camera, ignore the triangle and return
		if(Tri.normal.dotProduct(this.direction) > 0)
			return 0;
		
		var mp = this.pointTransform(Tri.midpoint);
		this.ctx.fillStyle = '#00FFFF'
		this.ctx.fillRect(mp.x, mp.y, 4, 4)
		// Figure out the position of the 2D triangle on the screen
		var Tri2D = new Triangle2D(
			this.pointTransform(Tri.vert[0]),
			this.pointTransform(Tri.vert[1]),
			this.pointTransform(Tri.vert[2]),
			Tri.color,
			Math.abs(cosNormal)
		);

		if(this.triangleQueue.length == 0){
			this.triangleQueue.push(Tri2D);
			return 0;
		}
		else{
			for(var i = 0; i < this.triangleQueue.length; i++){
				if(Tri2D.vert[0].z > this.triangleQueue[i].vert[0].z ){
					this.triangleQueue.splice(i, 0, Tri2D);
					return 0;
				}
			}
			this.triangleQueue.push(Tri2D);
			return 0;
		}*/
	}

	// Fill all triangles
	fillTriangle(Tri) {
		/*
		var grd = this.ctx.createLinearGradient(Tri.vert[0].x, Tri.vert[0].y, Tri.vert[1].x, Tri.vert[1].y);
		*/
		//grd.addColorStop(0, Tri.color1);
		// grd.addColorStop(1, "white");
		/*
		this.ctx.fillStyle = 'rgb('+
		Math.floor(255*Tri.cosNormal)+','+
		Math.floor(255*Tri.cosNormal)+','+
		Math.floor(255*Tri.cosNormal)+')'
		*/
		this.ctx.beginPath();
		this.ctx.moveTo(Tri.vert[0].x, Tri.vert[0].y);
		this.ctx.lineTo(Tri.vert[1].x, Tri.vert[1].y);
		this.ctx.lineTo(Tri.vert[2].x, Tri.vert[2].y);

		if(this.DEBUG){
			this.ctx.fillStyle = 'rgba(255,255,0,0.2)'
			this.ctx.strokeStyle = 'rgba(255,255,0,0.5)'
			this.ctx.stroke();
		}
		else{
			this.ctx.fillStyle = Tri.color
				this.ctx.fill();
		}
	}
	
	draw(){
		
		var draws = 0;
		// Set up "World Transform" though not updating theta 
		// makes this a bit redundant
		var matRotZ = new Mat4x4()
		var matRotX = new Mat4x4();
		var fTheta = 0;

		//fTheta += 1.0f * fElapsedTime; // Uncomment to spin me right round baby right round
		matRotZ = Matrix_MakeRotationZ(fTheta * 0.5);
		matRotX = Matrix_MakeRotationX(fTheta);

		var matTrans = new Mat4x4();
		matTrans = Matrix_MakeTranslation(0.0, 0.0, 5.0);

		var matWorld = new Mat4x4();
		matWorld = Matrix_MakeIdentity();	// Form World Matrix
		matWorld = Matrix_MultiplyMatrix(matRotZ, matRotX); // Transform by rotation
		matWorld = Matrix_MultiplyMatrix(matWorld, matTrans); // Transform by translation

		// Create "Point At" Matrix for camera
		var vUp = new Vector3D(0,1,0);
		var vTarget = new Vector3D(0,1,0);
		var matCameraRot = Matrix_MakeRotationY(0);
		var vLookDir = Matrix_MultiplyVector(matCameraRot, vTarget);
		vTarget = Vector_Add(this.position, vLookDir);
		var matCamera = Matrix_PointAt(this.position, vTarget, vUp);

		// Make view matrix from camera
		var matView = Matrix_QuickInverse(matCamera);

		for (i = 0; i < this.triangleQueue.length; i++)
		{
			var tri = this.triangleQueue[i];
			var triProjected = new Triangle();
			var triTransformed = new Triangle();
			var triViewed = new Triangle();

			// World Matrix Transform
			triTransformed.vert[0] = Matrix_MultiplyVector(matWorld, tri.vert[0]);
			triTransformed.vert[1] = Matrix_MultiplyVector(matWorld, tri.vert[1]);
			triTransformed.vert[2] = Matrix_MultiplyVector(matWorld, tri.vert[2]);

			// Calculate triangle Normal
			var normal = new Vector3D();
			var line1 = new Vector3D();
			var line2 = new Vector3D();

			// Get lines either side of triangle
			line1 = Vector_Sub(triTransformed.vert[1], triTransformed.vert[0]);
			line2 = Vector_Sub(triTransformed.vert[2], triTransformed.vert[0]);

			// Take cross product of lines to get normal to triangle surface
			normal = Vector_CrossProduct(line1, line2);

			// You normally need to normalise a normal!
			normal = Vector_Normalise(normal);
			
			// Get Ray from triangle to camera
			var vCameraRay = Vector_Sub(triTransformed.vert[0], this.position);

			// If ray is aligned with normal, then triangle is visible
			if (Vector_DotProduct(normal, vCameraRay) < 0.0)
			{
				// Illumination
				var light_direction = new Vector3D(0.0, 1.0, -1.0);
				light_direction = Vector_Normalise(light_direction);

				// How "aligned" are light direction and triangle surface normal?
				var dp = Math.max(0.1, Vector_DotProduct(light_direction, normal));

				// Choose console colours as required (much easier with RGB)
				triTransformed.color = 		this.ctx.fillStyle = 'rgb('+
					Math.floor(255*dp)+','+
					Math.floor(255*dp)+','+
					Math.floor(255*dp)+')';

				// Convert World Space --> View Space
				triViewed.vert[0] = Matrix_MultiplyVector(matView, triTransformed.vert[0]);
				triViewed.vert[1] = Matrix_MultiplyVector(matView, triTransformed.vert[1]);
				triViewed.vert[2] = Matrix_MultiplyVector(matView, triTransformed.vert[2]);
				triViewed.color = triTransformed.color;

				// Clip Viewed Triangle against near plane, this could form two additional
				// additional triangles. 
				var clippedTriangles = this.Triangle_ClipAgainstPlane(new Vector3D( 0.0, 0.0, 0.1 ), new Vector3D( 0.0, 0.0, 1.0 ), triViewed);

				// We may end up with multiple triangles form the clip, so project as
				// required
				for (var n = 0; n < clippedTriangles.length; n++)
				{
					// Project triangles from 3D --> 2D
					triProjected.vert[0] = Matrix_MultiplyVector(matProj, clipped[n].p[0]);
					triProjected.vert[1] = Matrix_MultiplyVector(matProj, clipped[n].p[1]);
					triProjected.vert[2] = Matrix_MultiplyVector(matProj, clipped[n].p[2]);
					triProjected.col = clipped[n].col;
					triProjected.sym = clipped[n].sym;

					// Scale into view, we moved the normalising into cartesian space
					// out of the matrix.vector function from the previous videos, so
					// do this manually
					triProjected.vert[0] = Vector_Div(triProjected.vert[0], triProjected.vert[0].w);
					triProjected.vert[1] = Vector_Div(triProjected.vert[1], triProjected.vert[1].w);
					triProjected.vert[2] = Vector_Div(triProjected.vert[2], triProjected.vert[2].w);

					// X/Y are inverted so put them back
					triProjected.vert[0].x *= -1.0;
					triProjected.vert[1].x *= -1.0;
					triProjected.vert[2].x *= -1.0;
					triProjected.vert[0].y *= -1.0;
					triProjected.vert[1].y *= -1.0;
					triProjected.vert[2].y *= -1.0;

					// Offset verts into visible normalised space
					vOffsetView = new Vector3D(1,1,0);
					triProjected.vert[0] = Vector_Add(triProjected.vert[0], vOffsetView);
					triProjected.vert[1] = Vector_Add(triProjected.vert[1], vOffsetView);
					triProjected.vert[2] = Vector_Add(triProjected.vert[2], vOffsetView);
					triProjected.vert[0].x *= 0.5 * this.screenWidth;
					triProjected.vert[0].y *= 0.5 * this.screenHeight;
					triProjected.vert[1].x *= 0.5 * this.screenWidth;
					triProjected.vert[1].y *= 0.5 * this.screenHeight;
					triProjected.vert[2].x *= 0.5 * this.screenWidth;
					triProjected.vert[2].y *= 0.5 * this.screenHeight;

					// Store triangle for sorting
					vecTrianglesToRaster.push_back(triProjected);
				}			
			}
		}

		// Sort triangles from back to front
		/*
		sort(vecTrianglesToRaster.begin(), vecTrianglesToRaster.end(),
		{
			float z1 = (t1.p[0].z + t1.p[1].z + t1.p[2].z) / 3.0f;
			float z2 = (t2.p[0].z + t2.p[1].z + t2.p[2].z) / 3.0f;
			return z1 > z2;
		});
		*/

		// Clear Screen
		// Fill(0, 0, ScreenWidth(), ScreenHeight(), PIXEL_SOLID, FG_BLACK);

		// Loop through all transformed, viewed, projected, and sorted triangles
		for (var i = 0; i < this.triangleQueue.length; i++)
		{
			var vecTrianglesToRaster = this.triangleQueue[i];
			// Clip triangles against all four screen edges, this could yield
			// a bunch of triangles, so create a queue that we traverse to 
			//  ensure we only test new triangles generated against planes
			var listTriangles = new Array();

			// Add initial triangle
			listTriangles.push(this.triangleQueue.shift());
			var nNewTriangles = 1;

			for (var p = 0; p < 4; p++)
			{
				var TrisToAdd = new Array();
				while (nNewTriangles > 0)
				{
					// Take triangle from front of queue
					var test = listTriangles.shift();
					nNewTriangles--;

					// Clip it against a plane. We only need to test each 
					// subsequent plane, against subsequent new triangles
					// as all triangles after a plane clip are guaranteed
					// to lie on the inside of the plane. I like how this
					// comment is almost completely and utterly justified
					switch (p)
					{
					case 0:	TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, 0.0, 0.0), 					new Vector3D( 0.0, 1.0, 0.0 ), test); break;
					case 1:	TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, this.screenHeight - 1, 0.0 ), 	new Vector3D(0.0, -1.0, 0.0 ), test); break;
					case 2:	TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, 0.0, 0.0 ), 					new Vector3D(1.0, 0.0, 0.0), test); break;
					case 3:	TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(this.screenWidth - 1, 0.0, 0.0 ), 	new Vector3D( -1.0, 0.0, 0.0 ), test); break;
					}

					// Clipping may yield a variable number of triangles, so
					// add these new ones to the back of the queue for subsequent
					// clipping against next planes
					for (var w = 0; w < TrisToAdd.length; w++)
						listTriangles.push(TrisToAdd[w]);
				}
			}
			// Draw the transformed, viewed, clipped, projected, sorted, clipped triangles
			console.log(listTriangles.length)
			while(listTriangles.length > 0)
			{	
				console.log(listTriangles.shift());
				//DrawTriangle(t.p[0].x, t.p[0].y, t.p[1].x, t.p[1].y, t.p[2].x, t.p[2].y, PIXEL_SOLID, FG_BLACK);
				draws++;
			}
		/*
		while(this.triangleQueue.length > 0){
			
			// Check each triangle to ensure they are on screen, otherwise we cull them
			var tris = [this.triangleQueue.shift()]
			var whiles = 0;
			while(tris.length > 0){
				var tri = tris.shift()
			}
			//this.fillTriangle(this.triangleQueue.shift())
			//draws++
		}*/
		this.ctx.fillText('Draws: ' + draws, 10, 220);

		}
	}
}

triTransform(tri){
	var resTri = new Triangle()

	// 1. TRANSFORM THE TRIANGLE RELATIVE TO THE CAMERA POSITION
	var pTranslated = new Array()
	pTranslated[0] = tri.vert[0].sub(this.position);		// Find the vector from camera to point
	pTranslated[1] = tri.vert[1].sub(this.position);		// Find the vector from camera to point
	pTranslated[2] = tri.vert[0].sub(this.position);		// Find the vector from camera to point

	// If the points are all behind the camera, we cannot possibly see it. Cull the triangle
	//var zDist = (this.direction.dotProduct(p));
	//var cosTheta = (zDist/p.length());
	//if (cosTheta < 0.79){
	//	offScreenPoints++;
	//	if(offScreenPoints>2){
	//		return 0;
	//	}
	//}


	// var t = 1/(zDist);		// t is the parameter value of the line when interstecting the plane of the canvas

	// var depth = p.length();		// Find the absolute distance from camera to point

	// 2. ROTATE WORLD OBJECTS TO THE CORRECT ORIENTATION ABOUT THE CAMERA
	var pTransformed = new Array()
	var Qrot = new Quaternion(this.rotation.w, this.rotation.x, this.rotation.y, this.rotation.z)
	var Qconj = Qrot.Qconjugate()

	// To rotate point p using rotation quaternion q, p' = q * p * qconj
	pTransformed[0] = Quaternion_Mul_Q(Quaternion_Mul_V(Qrot, pTranslated[0]), Qconj);
	pTransformed[1] = Quaternion_Mul_Q(Quaternion_Mul_V(Qrot, pTranslated[1]), Qconj);
	pTransformed[2] = Quaternion_Mul_Q(Quaternion_Mul_V(Qrot, pTranslated[2]), Qconj);

	// 3. PROJECT THE POINT ONTO THE SCREEN
	var pProjected = new Array()
	pProjected[0] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 0.1), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), pTransformed[0])
	pProjected[1] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 0.1), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), pTransformed[1])
	pProjected[2] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 0.1), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), pTransformed[2])

	// Find the distance from the point to the plane of the camera

	// 3. PROJECT THE POINT ONTO THE SCREEN
	for (var i = 0; i < 3; i++)
	{
		var drawPos = pProjected[i]
		// drawPos = drawPos.scale(t);
		drawPos.x = this.screenWidth*(this.invTanFOV*drawPos.x + 0.5);
		drawPos.y = this.screenHeight*(0.5 - this.invTanFOV*drawPos.y);
		resTri.color = tri.color
		resTri.vert[i] = drawPos;
	}
	return resTri
}

// this function works!!!
triTransform(tri){
	var resTri = new Triangle()
	var offScreenPoints = 0;
	for(var i = 0; i < 3; i++){
		// 1. TRANSFORM THE POINT RELATIVE TO THE TRIANGLE
		var p = tri.vert[i].sub(this.position);		// Find the vector from camera to point

		// If the points are all behind the camera, we cannot possibly see it. Cull the triangle
		var zDist = (this.direction.dotProduct(p));
		var cosTheta = (zDist/p.length());
		//if (cosTheta < 0.79){
		//	offScreenPoints++;
		//	if(offScreenPoints>2){
		//		return 0;
		//	}
		//}
		var t = 1/(zDist);		// t is the parameter value of the line when interstecting the plane of the canvas

		var depth = p.length();		// Find the absolute distance from camera to point

		// 2. ROTATE WORLD OBJECTS TO THE CORRECT ORIENTATION ABOUT THE CAMERA
		var Qrot = new Quaternion(this.rotation.w, this.rotation.x, this.rotation.y, this.rotation.z)
		var Qconj = Qrot.Qconjugate()
		Qrot = Quaternion_Mul_V(Qrot, p);
		Qrot.Qmul(Qconj);

		var drawPos = new Vector3D()
		drawPos.x = Qrot.x;
		drawPos.y = Qrot.y;
		drawPos.z = Qrot.z;

		// Find the distance from the point to the plane of the camera

		// 3. PROJECT THE POINT ONTO THE SCREEN
		drawPos = drawPos.scale(t);
		drawPos.x = this.screenWidth*(this.invTanFOV*drawPos.x + 0.5);
		drawPos.y = this.screenHeight*(0.5 - this.invTanFOV*drawPos.y);
		drawPos.z = zDist;
		resTri.color = tri.color
		resTri.vert[i] = drawPos;
	}
	return resTri
}

//WORK IN PROGRESS
triTransform(tri){
	var resTri = new Triangle()

	// 1. TRANSFORM THE TRIANGLE RELATIVE TO THE CAMERA POSITION
	var pTranslated = new Array()
	pTranslated[0] = tri.vert[0].sub(this.position);		// Find the vector from camera to point
	pTranslated[1] = tri.vert[0].sub(this.position);		// Find the vector from camera to point
	pTranslated[2] = tri.vert[0].sub(this.position);		// Find the vector from camera to point

	// If the points are all behind the camera, we cannot possibly see it. Cull the triangle
	//var zDist = (this.direction.dotProduct(p));
	//var cosTheta = (zDist/p.length());
	//if (cosTheta < 0.79){
	//	offScreenPoints++;
	//	if(offScreenPoints>2){
	//		return 0;
	//	}
	//}


	// var t = 1/(zDist);		// t is the parameter value of the line when interstecting the plane of the canvas

	// var depth = p.length();		// Find the absolute distance from camera to point

	// 2. ROTATE WORLD OBJECTS TO THE CORRECT ORIENTATION ABOUT THE CAMERA
	var pTransformed = new Array()
	var Qrot = new Quaternion(this.rotation.w, this.rotation.x, this.rotation.y, this.rotation.z)
	var Qconj = Qrot.Qconjugate()

	// To rotate point p using rotation quaternion q, p' = q * p * qconj
	pTransformed[0] = Quaternion_Mul_Q(Quaternion_Mul_V(Qrot, pTranslated[0]), Qconj);
	pTransformed[1] = Quaternion_Mul_Q(Quaternion_Mul_V(Qrot, pTranslated[1]), Qconj);
	pTransformed[2] = Quaternion_Mul_Q(Quaternion_Mul_V(Qrot, pTranslated[2]), Qconj);

	// 3. PROJECT THE POINT ONTO THE SCREEN
	var pProjected = new Array()
	pProjected[0] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 0.1), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), pTransformed[0])
	pProjected[1] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 0.1), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), pTransformed[1])
	pProjected[2] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 0.1), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), pTransformed[2])

	// Find the distance from the point to the plane of the camera
	//console.log(pProjected[0])
	// 3. PROJECT THE POINT ONTO THE SCREEN
	for (var i = 0; i < 3; i++)
	{
		var drawPos = pProjected[i]
		// drawPos = drawPos.scale(t);
		drawPos.z = drawPos.sub(pTransformed[i]).length()
		drawPos.x = this.screenWidth*(this.invTanFOV*drawPos.x + 0.5);
		drawPos.y = this.screenHeight*(0.5 - this.invTanFOV*drawPos.y);

		resTri.vert[i] = drawPos;
		console.log(drawPos)
	}
	resTri.color = tri.color
	return resTri
}